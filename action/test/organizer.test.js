const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const dictionary = require('../src/typos-dictionary');
const { defaults, loadConventions, glob } = require('../src/conventions');
const { detect, detectCaseConflicts } = require('../src/detector');
const { applyFixes } = require('../src/fixer');
const { captureImportGraph, updateImports } = require('../src/import-updater');
const { git, trackedFiles, assertClean, commitAndPush } = require('../src/git-ops');
const flags = { case: true, typos: true, structure: true };

async function fixture(t, files) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'auto-organizer-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await git(root, ['init', '-b', 'feature']);
  await git(root, ['config', 'user.name', 'Organizer Test']);
  await git(root, ['config', 'user.email', 'test@example.invalid']);
  for (const [name, content] of Object.entries(files)) {
    await fs.mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await fs.writeFile(path.join(root, name), content);
  }
  await git(root, ['add', '.']);
  await git(root, ['commit', '-m', 'fixture']);
  return root;
}

test('dictionary contains more than 70 known corrections', () => {
  assert.ok(Object.keys(dictionary).length > 70);
  assert.equal(dictionary.compontents, 'components');
});

test('case detector scopes directory changes to folders involved in the PR', () => {
  const files = ['src/Components/Button.tsx', 'src/components/Input.tsx', 'other/Components/Other.tsx'];
  assert.deepEqual(detectCaseConflicts(files, defaults, [files[0]]), [{ from: files[0], to: 'src/components/Button.tsx', kind: 'case' }]);
});

test('typo and structure corrections compose; disabled case fixes stay disabled', async () => {
  const conventions = { ...defaults, structure: [{ pattern: 'src/components/*.test.ts', destination: 'src/tests' }] };
  const plan = await detect(['src/compontents/Button.test.ts'], ['src/compontents/Button.test.ts'], conventions, flags);
  assert.equal(plan[0].to, 'src/tests/Button.test.ts');
  const noCase = await detect(['src/Components/Button.tsx'], ['src/Components/Button.tsx'], defaults, { ...flags, case: false });
  assert.deepEqual(noCase, []);
});

test('existing destinations and converging moves do not overwrite data', async t => {
  const root = await fixture(t, { 'src/Components/Button.tsx': 'old', 'src/components/Button.tsx': 'keep' });
  const list = await trackedFiles(root);
  const plan = await detect(list, list, defaults, flags);
  const result = await applyFixes(root, plan);
  assert.equal(result.applied.length, 0);
  assert.equal(result.skipped.length, 1);
  assert.equal(await fs.readFile(path.join(root, 'src/components/Button.tsx'), 'utf8'), 'keep');
  await assertClean(root);
  const duplicates = await applyFixes(root, [
    { from: list[0], to: 'src/Button.tsx', reasons: ['structure'] },
    { from: list[1], to: 'src/Button.tsx', reasons: ['structure'] },
  ]);
  assert.equal(duplicates.applied.length, 0);
  assert.equal(duplicates.skipped.length, 2);
});

test('git moves update ES modules, aliases, CommonJS, dynamic imports and moved importers', async t => {
  const main = [
    'import Button from "./Components/Button";',
    'export { default as Named } from "@/Components/Button";',
    'const other = require("./Components/Button");',
    'const lazy = () => import("./Components/Button");',
    'const css = () => import("./Components/theme.css?raw");',
    'const text = "./Components/Button";',
    '// import Untouched from "./Components/Button";',
  ].join('\n');
  const root = await fixture(t, {
    'src/Components/Button.tsx': 'export default function Button() {}',
    'src/Components/theme.css': 'body {}',
    'src/state.ts': 'export const state = 1;',
    'src/useTheme.ts': 'import { state } from "./state.js"; export { state };',
    'src/main.ts': main,
  });
  const conventions = { ...defaults, structure: [{ pattern: 'src/use*.ts', destination: 'src/hooks' }] };
  const files = await trackedFiles(root);
  const graph = await captureImportGraph(root, files, conventions);
  const plan = await detect(files, ['src/Components/Button.tsx', 'src/useTheme.ts'], conventions, flags);
  const { applied, skipped } = await applyFixes(root, plan);
  assert.equal(skipped.length, 0);
  assert.equal(applied.length, 3);
  const updated = await updateImports(root, graph, applied);
  assert.equal(updated.length, 2);
  const result = await fs.readFile(path.join(root, 'src/main.ts'), 'utf8');
  assert.match(result, /import Button from "\.\/components\/Button"/);
  assert.match(result, /from "@\/components\/Button"/);
  assert.match(result, /require\("\.\/components\/Button"\)/);
  assert.match(result, /import\("\.\/components\/theme.css\?raw"\)/);
  assert.match(result, /const text = "\.\/Components\/Button"/);
  assert.match(result, /\/\/ import Untouched from "\.\/Components\/Button"/);
  assert.match(await fs.readFile(path.join(root, 'src/hooks/useTheme.ts'), 'utf8'), /from "\.\.\/state.js"/);
  assert.match((await git(root, ['diff', '--cached', '--name-status'])).stdout, /R100/);
});

test('aliases from root tsconfig and directory index imports are preserved', async t => {
  const root = await fixture(t, {
    'tsconfig.json': JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '~/*': ['src/*'] } } }),
    'src/Components/index.ts': 'export const value = 1;',
    'src/main.ts': 'import { value } from "~/Components";',
  });
  const files = await trackedFiles(root);
  const graph = await captureImportGraph(root, files, defaults);
  const { applied } = await applyFixes(root, await detect(files, files, defaults, flags));
  await updateImports(root, graph, applied);
  assert.equal(await fs.readFile(path.join(root, 'src/main.ts'), 'utf8'), 'import { value } from "~/components";');
});

test('conventions reject escaping paths and validate structure rules', async t => {
  const root = await fixture(t, { 'file.txt': 'safe', '.organizer.json': JSON.stringify({ structure: [{ pattern: 'src/*.ts', destination: '../outside' }] }) });
  await assert.rejects(() => loadConventions(root, '../outside.json'), /inside/);
  await assert.rejects(() => loadConventions(root), /Invalid structure/);
  assert.equal(glob('src/**/*.ts').test('src/hooks/useTheme.ts'), true);
});

test('symlink destinations are skipped and dirty checkouts cannot be committed blindly', async t => {
  const root = await fixture(t, { 'src/useTheme.ts': 'export {};', 'outside/keep.txt': 'safe' });
  await fs.symlink(path.join(root, 'outside'), path.join(root, 'src/hooks'));
  const result = await applyFixes(root, [{ from: 'src/useTheme.ts', to: 'src/hooks/useTheme.ts', reasons: ['structure'] }]);
  assert.equal(result.skipped.length, 1);
  assert.equal(await fs.readFile(path.join(root, 'outside/keep.txt'), 'utf8'), 'safe');
  await assert.rejects(() => assertClean(root), /local changes/);
});

test('commit and push only go to the requested branch of a local test remote', async t => {
  const root = await fixture(t, { 'src/Components/Button.tsx': 'export default 1;' });
  const remote = await fs.mkdtemp(path.join(os.tmpdir(), 'auto-organizer-remote-'));
  t.after(() => fs.rm(remote, { recursive: true, force: true }));
  await git(remote, ['init', '--bare']);
  await git(root, ['remote', 'add', 'origin', remote]);
  await git(root, ['push', '-u', 'origin', 'feature']);
  const files = await trackedFiles(root);
  const { applied } = await applyFixes(root, await detect(files, files, defaults, flags));
  assert.equal(await commitAndPush(root, applied.map(entry => entry.to), 'feature', 'organize test files'), true);
  await assertClean(root);
  const head = (await git(root, ['rev-parse', 'HEAD'])).stdout.trim();
  const remoteHead = (await git(remote, ['rev-parse', 'refs/heads/feature'])).stdout.trim();
  assert.equal(head, remoteHead);
});
