const fs = require('node:fs/promises');
const path = require('node:path');

const defaults = {
  folders: ['src', 'components', 'hooks', 'utils', 'services', 'types', 'styles', 'assets', 'tests'],
  ignore: ['node_modules/**', 'dist/**', 'build/**', 'vendor/**', '.git/**'],
  aliases: { '@/*': ['src/*'] },
  structure: [],
};

function safePath(value) {
  return typeof value === 'string' && value.length > 0 && !value.startsWith('/')
    && !/[\\\x00-\x1f]/.test(value) && !value.split('/').some(part => part === '..' || part === '.git')
    && !/^[A-Za-z]:/.test(value);
}

function glob(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  return new RegExp('^' + escaped.replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]').replace(/\u0000/g, '.*') + '$');
}

async function loadConventions(root, filename = '.organizer.json') {
  if (!safePath(filename)) throw new Error('conventions-file must stay inside the checkout.');
  let custom;
  try {
    const actual = await fs.realpath(path.join(root, filename));
    const relative = path.relative(await fs.realpath(root), actual);
    if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Conventions file escapes checkout.');
    custom = JSON.parse(await fs.readFile(actual, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') custom = {};
    else throw error;
  }
  if (!custom || Array.isArray(custom) || typeof custom !== 'object') throw new Error('Conventions must be a JSON object.');
  const result = { ...defaults, ...custom, aliases: { ...defaults.aliases, ...custom.aliases } };
  for (const key of ['folders', 'ignore']) {
    if (!Array.isArray(result[key]) || !result[key].every(item => typeof item === 'string')) throw new Error('Invalid ' + key + ' list.');
  }
  if (!result.folders.every(folder => /^[a-z][a-z0-9_-]*$/.test(folder))) throw new Error('folders must contain lowercase directory names.');
  if (!Array.isArray(result.structure)) throw new Error('structure must be an array.');
  for (const rule of result.structure) {
    if (!safePath(rule.pattern) || !safePath(rule.destination) || /[*?]/.test(rule.destination)) throw new Error('Invalid structure rule.');
  }
  for (const [alias, targets] of Object.entries(result.aliases)) {
    if (!alias || !Array.isArray(targets) || !targets.every(safePath)) throw new Error('Invalid alias mapping.');
  }
  return result;
}

module.exports = { defaults, loadConventions, safePath, glob };
