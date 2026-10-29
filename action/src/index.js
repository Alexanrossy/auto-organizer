const core = require('@actions/core');
const github = require('@actions/github');
const path = require('node:path');
const { loadConventions } = require('./conventions');
const { detect } = require('./detector');
const { applyFixes } = require('./fixer');
const { captureImportGraph, updateImports } = require('./import-updater');
const { trackedFiles, assertClean, commitAndPush, git } = require('./git-ops');

const boolean = name => core.getInput(name) ? core.getBooleanInput(name) : true;
const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('|', '&#124;').replaceAll('`', '&#96;');

async function run() {
  for (const name of ['files-fixed', 'files-renamed', 'folders-unified']) core.setOutput(name, 0);
  core.setOutput('comment-url', '');
  const token = core.getInput('github-token', { required: true });
  const mode = core.getInput('mode') || 'report';
  if (!['report', 'fix'].includes(mode)) throw new Error('mode must be report or fix.');
  const context = github.context;
  if (context.eventName !== 'pull_request' || !context.payload.pull_request) throw new Error('Use a pull_request event.');
  const pr = context.payload.pull_request;
  const octokit = github.getOctokit(token);
  const repo = context.repo;
  const root = path.resolve(process.env.GITHUB_WORKSPACE || process.cwd());
  const files = await octokit.paginate(octokit.rest.pulls.listFiles, { ...repo, pull_number: pr.number, per_page: 100 });
  const { data: currentPR } = await octokit.rest.pulls.get({ ...repo, pull_number: pr.number });
  if (files.length < currentPR.changed_files) throw new Error('GitHub returned an incomplete file list. Split this PR before running fixes.');
  if (currentPR.head.sha !== pr.head.sha) throw new Error('The PR changed during this run. Retry on its latest commit.');
  const head = (await git(root, ['rev-parse', 'HEAD'])).stdout.trim();
  if (head !== pr.head.sha) throw new Error('Checkout the PR head SHA, not its synthetic merge commit.');
  const tracked = await trackedFiles(root);
  const changed = files.filter(file => file.status !== 'removed').map(file => file.filename);
  const conventions = await loadConventions(root, core.getInput('conventions-file') || '.organizer.json');
  const flags = { case: boolean('fix-case-conflicts'), typos: boolean('fix-typos'), structure: boolean('fix-structure') };
  const plan = await detect(tracked, changed, conventions, flags);
  const sameRepo = pr.head.repo?.full_name?.toLowerCase() === (repo.owner + '/' + repo.repo).toLowerCase();
  const canFix = mode === 'fix' && sameRepo;
  let applied = [], skipped = [], imports = [], pushed = false;
  if (canFix && plan.length) {
    await assertClean(root);
    const graph = boolean('update-imports') ? await captureImportGraph(root, tracked, conventions) : [];
    ({ applied, skipped } = await applyFixes(root, plan));
    imports = await updateImports(root, graph, applied);
    if (applied.length) {
      pushed = await commitAndPush(root, [...applied.map(entry => entry.to), ...imports], pr.head.ref,
        core.getInput('commit-message') || 'chore: organize files and update imports');
    }
  }
  const folders = new Set(applied.filter(entry => entry.reasons.includes('case')).map(entry => path.dirname(entry.from)));
  core.setOutput('files-fixed', new Set([...applied.map(entry => entry.to), ...imports]).size);
  core.setOutput('files-renamed', applied.length);
  core.setOutput('folders-unified', folders.size);
  const outcome = canFix ? (pushed ? 'Correções commitadas no PR.' : 'Nenhum commit gerado.') : 'Modo relatório: nenhum arquivo alterado.';
  const rows = plan.slice(0, 100).map(entry => {
    const failure = skipped.find(item => item.from === entry.from);
    const status = failure ? 'Revisão manual: ' + escape(failure.error) : applied.some(item => item.from === entry.from) ? 'Corrigido' : 'Detectado';
    return '| <code>' + escape(entry.from) + '</code> | <code>' + escape(entry.to) + '</code> | ' + status + ' |';
  });
  const report = ['<!-- auto-organizer-v2 -->', '## Auto-Organizer v2.0', '', outcome,
    !sameRepo ? 'PR de fork: correções automáticas desativadas.' : '',
    '', plan.length + ' alterações detectadas · ' + applied.length + ' arquivos movidos · ' + imports.length + ' arquivos com imports atualizados',
    '', '| Antes | Depois | Resultado |', '| --- | --- | --- |', ...rows,
    plan.length > 100 ? '\nExibindo as primeiras 100 alterações. Consulte o diff do commit para a lista completa.' : '',
    '\nReexecute os testes do projeto após aplicar as correções.',
  ].filter(line => line !== undefined).join('\n');
  await core.summary.addRaw(report).write();
  try {
    const comments = await octokit.paginate(octokit.rest.issues.listComments, { ...repo, issue_number: pr.number, per_page: 100 });
    const previous = comments.find(comment => comment.user?.login === 'github-actions[bot]' && comment.body?.startsWith('<!-- auto-organizer-v2 -->'));
    const result = previous
      ? await octokit.rest.issues.updateComment({ ...repo, comment_id: previous.id, body: report })
      : await octokit.rest.issues.createComment({ ...repo, issue_number: pr.number, body: report });
    core.setOutput('comment-url', result.data.html_url);
  } catch (error) {
    core.warning('Comment unavailable (HTTP ' + (error.status || 'unknown') + '). The report is available in the job summary.');
  }
  if (skipped.length) core.warning(skipped.length + ' conflicting moves require manual review.');
}

run().catch(error => core.setFailed(error.message));
