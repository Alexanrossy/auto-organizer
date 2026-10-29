const fs = require('node:fs/promises');
const path = require('node:path');
const { git } = require('./git-ops');
const { safePath } = require('./conventions');

async function assertInside(root, file) {
  if (!safePath(file)) throw new Error('Invalid path: ' + file);
  const parts = file.split('/');
  for (let i = 1; i <= parts.length; i++) {
    try {
      const stat = await fs.lstat(path.join(root, ...parts.slice(0, i)));
      if (stat.isSymbolicLink()) throw new Error('Symbolic links require manual review: ' + file);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

async function moveFile(root, from, to) {
  await assertInside(root, from);
  await assertInside(root, to);
  try {
    await fs.lstat(path.join(root, to));
    throw new Error('Destination already exists: ' + to);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await fs.mkdir(path.dirname(path.join(root, to)), { recursive: true });
  await git(root, ['mv', '--', from, to]);
}

const fixCaseConflict = moveFile;
const fixTypo = moveFile;

async function applyFixes(root, plan) {
  const applied = [];
  const skipped = [];
  const counts = new Map();
  for (const entry of plan) counts.set(entry.to.toLowerCase(), (counts.get(entry.to.toLowerCase()) || 0) + 1);
  for (const entry of plan) {
    if (counts.get(entry.to.toLowerCase()) > 1) {
      skipped.push({ ...entry, error: 'Multiple files would have the same destination.' });
      continue;
    }
    try {
      const move = entry.reasons.includes('case') ? fixCaseConflict : entry.reasons.includes('typo') ? fixTypo : moveFile;
      await move(root, entry.from, entry.to);
      applied.push(entry);
    } catch (error) {
      skipped.push({ ...entry, error: error.message });
    }
  }
  return { applied, skipped };
}

module.exports = { applyFixes, moveFile, fixCaseConflict, fixTypo, assertInside };
