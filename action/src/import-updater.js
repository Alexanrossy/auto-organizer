const fs = require('node:fs/promises');
const path = require('node:path').posix;
const ts = require('typescript');
const { assertInside } = require('./fixer');
const codeExtension = /\.(?:[cm]?[jt]sx?)$/;
const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts', '.json', '.css', '.scss', '.svg'];

function aliasCandidates(specifier, aliases, baseUrl) {
  const results = [];
  for (const [pattern, targets] of Object.entries(aliases)) {
    const [prefix, suffix = ''] = pattern.split('*');
    const wildcard = pattern.includes('*');
    if (wildcard ? !specifier.startsWith(prefix) || !specifier.endsWith(suffix) : specifier !== pattern) continue;
    const middle = wildcard ? specifier.slice(prefix.length, suffix ? -suffix.length : undefined) : '';
    for (const target of targets) results.push({ file: path.join(baseUrl, target.replace('*', middle)), pattern, target, baseUrl });
  }
  return results;
}

function resolveFile(candidate, files) {
  const variants = [candidate, ...extensions.map(ext => candidate + ext), ...extensions.map(ext => path.join(candidate, 'index' + ext))];
  // TypeScript often uses runtime .js specifiers for source .ts/.tsx files.
  if (/\.[cm]?jsx?$/.test(candidate)) variants.push(candidate.replace(/\.js$/, '.ts'), candidate.replace(/\.js$/, '.tsx'), candidate.replace(/\.mjs$/, '.mts'), candidate.replace(/\.cjs$/, '.cts'));
  return variants.find(file => files.has(file));
}

async function captureImportGraph(root, files, conventions) {
  const knownFiles = new Set(files);
  const graph = [];
  let options = {};
  try {
    const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
    if (config.error && config.error.code !== 5083) throw new Error('Cannot parse tsconfig.json.');
    options = config.config?.compilerOptions || {};
  } catch (error) { throw new Error('Cannot read import configuration: ' + error.message); }
  const aliases = { ...conventions.aliases, ...options.paths };
  const baseUrl = options.baseUrl || '.';
  for (const file of files.filter(file => codeExtension.test(file))) {
    await assertInside(root, file);
    const text = await fs.readFile(path.join(root, file), 'utf8');
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    const imports = [];
    function visit(node) {
      let literal;
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) literal = node.moduleSpecifier;
      else if (ts.isCallExpression(node) && node.arguments.length === 1 && (
        node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require')
      )) literal = node.arguments[0];
      if (literal && ts.isStringLiteralLike(literal)) {
        const specifier = literal.text;
        const split = specifier.search(/[?#]/);
        const clean = split > 0 ? specifier.slice(0, split) : specifier;
        const suffix = split > 0 ? specifier.slice(split) : '';
        const relative = clean.startsWith('.');
        const candidates = relative
          ? [{ file: path.normalize(path.join(path.dirname(file), clean)) }]
          : [...aliasCandidates(clean, aliases, baseUrl), ...(options.baseUrl ? [{ file: path.join(baseUrl, clean), baseImport: true, baseUrl }] : [])];
        for (const candidate of candidates) {
          const target = resolveFile(candidate.file, knownFiles);
          if (!target) continue; // Package imports and computed expressions stay intact.
          imports.push({ start: literal.getStart(source) + 1, end: literal.end - 1, quote: text[literal.getStart(source)], clean, suffix, target, alias: candidate.pattern ? candidate : null, baseImport: candidate.baseImport, baseUrl });
          break;
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    if (imports.length) graph.push({ file, text, imports });
  }
  return graph;
}

function newSpecifier(record, newFile, newTarget) {
  let target = newTarget;
  const explicitExtension = path.extname(record.clean);
  if (!explicitExtension && codeExtension.test(target)) target = target.replace(codeExtension, '');
  else if (explicitExtension && codeExtension.test(target)) target = target.replace(codeExtension, explicitExtension);
  if (!explicitExtension && path.basename(target) === 'index' && path.basename(record.clean) !== 'index') target = path.dirname(target);
  if (record.alias?.target.includes('*')) {
    const [prefix, suffix = ''] = path.join(record.alias.baseUrl, record.alias.target).split('*');
    if (target.startsWith(prefix) && target.endsWith(suffix)) {
      const middle = target.slice(prefix.length, suffix ? -suffix.length : undefined);
      return record.alias.pattern.replace('*', middle) + record.suffix;
    }
  }
  if (record.baseImport) {
    const relative = path.relative(record.baseUrl, target);
    if (!relative.startsWith('../')) return relative + record.suffix;
  }
  const relative = path.relative(path.dirname(newFile), target);
  return (relative.startsWith('.') ? relative : './' + relative) + record.suffix;
}

async function updateImports(root, graph, applied) {
  const moves = new Map(applied.map(entry => [entry.from, entry.to]));
  const updated = [];
  for (const item of graph) {
    const currentFile = moves.get(item.file) || item.file;
    const edits = item.imports.flatMap(record => {
      if (!moves.has(item.file) && !moves.has(record.target)) return [];
      const replacement = newSpecifier(record, currentFile, moves.get(record.target) || record.target);
      if (replacement === record.clean + record.suffix) return [];
      return [{ ...record, replacement: replacement.replace(/\\/g, '\\\\').replaceAll(record.quote, '\\' + record.quote) }];
    }).sort((a, b) => b.start - a.start);
    if (!edits.length) continue;
    const current = await fs.readFile(path.join(root, currentFile), 'utf8');
    if (current !== item.text) throw new Error('File changed during import update: ' + currentFile);
    let text = item.text;
    for (const edit of edits) text = text.slice(0, edit.start) + edit.replacement + text.slice(edit.end);
    await fs.writeFile(path.join(root, currentFile), text);
    updated.push(currentFile);
  }
  return updated;
}

module.exports = { captureImportGraph, updateImports };
