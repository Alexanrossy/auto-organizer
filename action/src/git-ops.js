const { getExecOutput } = require('@actions/exec');

async function git(root, args, allowFailure = false) {
  const result = await getExecOutput('git', args, { cwd: root, silent: true, ignoreReturnCode: true });
  if (result.exitCode && !allowFailure) throw new Error('Git ' + args[0] + ' failed: ' + result.stderr.trim());
  return result;
}

async function trackedFiles(root) {
  return (await git(root, ['ls-files', '-z'])).stdout.split('\0').filter(Boolean);
}

async function assertClean(root) {
  if ((await git(root, ['status', '--porcelain', '--untracked-files=all'])).stdout.trim()) {
    throw new Error('The checkout has local changes. Run Auto-Organizer before build or code-generation steps.');
  }
}

async function commitAndPush(root, files, branch, message) {
  await git(root, ['check-ref-format', '--branch', branch]);
  await git(root, ['config', 'user.name', 'github-actions[bot]']);
  await git(root, ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
  const unique = [...new Set(files)];
  for (let i = 0; i < unique.length; i += 100) await git(root, ['add', '--', ...unique.slice(i, i + 100)]);
  const diff = await git(root, ['diff', '--cached', '--quiet'], true);
  if (diff.exitCode === 0) return false;
  if (diff.exitCode !== 1) throw new Error('Unable to inspect staged changes.');
  await git(root, ['commit', '--message', message]);
  // Never force-push. A concurrently updated branch causes a visible failure.
  await git(root, ['push', 'origin', 'HEAD:refs/heads/' + branch]);
  return true;
}

module.exports = { git, trackedFiles, assertClean, commitAndPush };
