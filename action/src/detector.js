const path = require('node:path').posix;
const dictionary = require('./typos-dictionary');
const { safePath, glob } = require('./conventions');

const directories = file => file.split('/').slice(0, -1).map((_, index) => file.split('/').slice(0, index + 1).join('/'));
const activeFolders = changed => new Set(changed.flatMap(directories).map(folder => folder.toLowerCase()));

function correctWord(word) {
  const corrected = dictionary[word.toLowerCase()];
  if (!corrected) return word;
  if (word === word.toUpperCase()) return corrected.toUpperCase();
  return /^[A-Z]/.test(word) ? corrected[0].toUpperCase() + corrected.slice(1) : corrected;
}

function correctPart(part) {
  return part.replace(/[A-Za-z]+/g, correctWord);
}

function detectCaseConflicts(files, conventions, changed = files) {
  const active = activeFolders(changed);
  const groups = new Map();
  for (const folder of files.flatMap(directories)) {
    const key = folder.toLowerCase();
    if (!groups.has(key)) groups.set(key, new Set());
    groups.get(key).add(folder);
  }
  return files.flatMap(from => {
    const parts = from.split('/');
    const to = parts.map((part, index) => {
      if (index === parts.length - 1) return part;
      const key = parts.slice(0, index + 1).join('/').toLowerCase();
      return active.has(key) && (conventions.folders.includes(part.toLowerCase()) || groups.get(key).size > 1) ? part.toLowerCase() : part;
    }).join('/');
    return to === from ? [] : [{ from, to, kind: 'case' }];
  });
}

function detectTypos(files, conventions, changed = files) {
  const active = activeFolders(changed);
  const changedSet = new Set(changed);
  return files.flatMap(from => {
    const parts = from.split('/');
    const to = parts.map((part, index) => {
      const relevant = index === parts.length - 1 ? changedSet.has(from) : active.has(parts.slice(0, index + 1).join('/').toLowerCase());
      const corrected = relevant ? correctPart(part) : part;
      return corrected !== part && index < parts.length - 1 && conventions.folders.includes(corrected.toLowerCase()) ? corrected.toLowerCase() : corrected;
    }).join('/');
    return to === from ? [] : [{ from, to, kind: 'typo' }];
  });
}

function structureTarget(file, conventions) {
  const rule = conventions.structure.find(entry => glob(entry.pattern).test(file));
  return rule ? path.join(rule.destination, path.basename(file)) : file;
}

function detectStructureIssues(files, conventions, changed = files) {
  const changedSet = new Set(changed);
  return files.filter(file => changedSet.has(file)).flatMap(from => {
    const to = structureTarget(from, conventions);
    return to === from ? [] : [{ from, to, kind: 'structure' }];
  });
}

async function detect(files, changed, conventions, flags) {
  const ignored = conventions.ignore.map(glob);
  const eligible = files.filter(file => safePath(file) && !ignored.some(pattern => pattern.test(file)));
  const [cases, typos, structure] = await Promise.all([
    flags.case ? Promise.resolve().then(() => detectCaseConflicts(eligible, conventions, changed)) : [],
    flags.typos ? Promise.resolve().then(() => detectTypos(eligible, conventions, changed)) : [],
    flags.structure ? Promise.resolve().then(() => detectStructureIssues(eligible, conventions, changed)) : [],
  ]);
  const byFile = new Map();
  for (const issue of [...cases, ...typos, ...structure]) {
    if (!byFile.has(issue.from)) byFile.set(issue.from, { from: issue.from, to: issue.from, reasons: [] });
    byFile.get(issue.from).reasons.push(issue.kind);
  }
  for (const entry of byFile.values()) {
    entry.to = cases.find(issue => issue.from === entry.from)?.to || entry.from;
    if (typos.some(issue => issue.from === entry.from)) {
      const typoParts = typos.find(issue => issue.from === entry.from).to.split('/');
      const oldParts = entry.from.split('/');
      entry.to = entry.to.split('/').map((part, index) => typoParts[index] !== oldParts[index] ? typoParts[index] : part).join('/');
    }
    if (flags.structure && changed.includes(entry.from)) {
      const destination = structureTarget(entry.to, conventions);
      if (destination !== entry.to && !entry.reasons.includes('structure')) entry.reasons.push('structure');
      entry.to = destination;
    }
  }
  return [...byFile.values()].filter(entry => entry.from !== entry.to && safePath(entry.to));
}

module.exports = { detectCaseConflicts, detectTypos, detectStructureIssues, detect };
