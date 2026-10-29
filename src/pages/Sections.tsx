import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowDownToLine, ArrowRight, ArrowUpRight, BookOpen, Check, CheckCircle2, ChevronDown, Code2, Command, FileCode2, FileJson2, FileText, Folder, FolderTree, GitBranch, GitCommitHorizontal, GitPullRequest, Layers3, MessageSquareText, MoveRight, Play, ScanLine, Search, Settings2, ShieldCheck, Sparkles, Terminal, Type, Workflow, X } from 'lucide-react';
import { CodeBlock, CopyButton } from '../components/CodeBlock';
import { DemoWindow } from '../components/DemoWindow';
import { examples, files, projectTree, workflowSource } from '../data/files';

export type Tab = 'visao-geral' | 'antes-depois' | 'codigo' | 'arquitetura' | 'setup';
type Navigate = (tab: Tab, file?: string) => void;

export function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: ReactNode; description: string }) {
  return <div className="section-heading"><div className="eyebrow"><span />{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>;
}

const features = [
  { icon: FolderTree, number: '01', title: 'Uma estrutura consistente.', text: 'Components ou components? Diretórios com capitalização divergente ganham uma única organização.', detail: 'Case conflicts', tone: 'copper' },
  { icon: Type, number: '02', title: 'Até os pequenos typos.', text: 'Mais de 70 erros conhecidos em nomes de arquivos e pastas, corrigidos pelo dicionário.', detail: 'Nomes bem resolvidos', tone: 'pink' },
  { icon: MoveRight, number: '03', title: 'Cada arquivo no seu lugar.', text: 'Defina suas convenções. Regras explícitas levam hooks, testes e outros arquivos ao destino certo.', detail: 'Suas regras, seu projeto', tone: 'violet' },
  { icon: Code2, number: '04', title: 'Imports que acompanham.', text: 'Caminhos relativos, aliases e reexports são atualizados quando um arquivo muda de lugar.', detail: 'Análise de sintaxe', tone: 'blue' },
  { icon: GitBranch, number: '05', title: 'O histórico continua.', text: 'Movimentos com git mv, registrados em um commit. Um diff que você pode revisar e entender.', detail: 'Feito para o Git', tone: 'mint' },
  { icon: MessageSquareText, number: '06', title: 'Tudo explicado no PR.', text: 'Um relatório reúne o que mudou e o que pede revisão. Sem precisar procurar nos logs.', detail: 'Visibilidade de ponta a ponta', tone: 'sand' },
];

export function Overview({ navigate }: { navigate: Navigate }) {
  const [demo, setDemo] = useState(0);
  return <>
    <section className="hero">
      <div className="hero-copy"><div className="release-pill"><span />Conheça a versão 2.0<ArrowUpRight size={12} /></div>
        <h1>Não apenas<br />detecta. <span className="gradient-text">Corrige.</span></h1>
        <p className="hero-description">Seu código, no lugar certo. Uma GitHub Action que organiza arquivos, corrige nomes e conecta os imports. Tudo no fluxo do seu pull request.</p>
        <div className="hero-actions"><button className="button button-primary" onClick={() => setDemo(value => value + 1)}>Ver em ação <Play size={14} fill="currentColor" /></button><button className="button button-secondary" onClick={() => navigate('codigo')}>Explorar o código <ArrowUpRight size={16} /></button></div>
        <div className="hero-assurance"><ShieldCheck size={15} /><span>Seus padrões. Seu Git. Seu controle.</span></div>
      </div>
      <DemoWindow trigger={demo} />
    </section>
    <div className="facts-strip"><div><ScanLine size={20} /><span><strong>3 detectores</strong><small>trabalhando juntos</small></span></div><div><FileCode2 size={20} /><span><strong>14 arquivos</strong><small>de código completo</small></span></div><div><Command size={20} /><span><strong>Uma configuração</strong><small>o fluxo continua por você</small></span></div><div className="fact-platform"><GitPullRequest size={18} /><span>Feito para<br /><strong>GitHub Actions</strong></span></div></div>
    <section className="section-spaced"><div className="section-intro"><div><span className="kicker">CUIDADO EM CADA DETALHE</span><h2>Menos ajustes.<br /><span className="muted-heading">Mais possibilidades.</span></h2></div><p>Os detalhes que interrompem uma revisão,<br className="desktop-only" /> resolvidos em um só lugar.</p></div>
      <div className="feature-grid">{features.map(({ icon: Icon, ...feature }) => <article className={'feature-card tone-' + feature.tone} key={feature.number}><div className="feature-top"><div className="feature-icon"><Icon size={23} strokeWidth={1.5} /></div><span>{feature.number}</span></div><h3>{feature.title}</h3><p>{feature.text}</p><div className="feature-detail">{feature.detail}<ArrowUpRight size={14} /></div></article>)}</div>
    </section>
    <section className="section-spaced flow-section"><div className="section-intro"><div><span className="kicker">DO PR AO COMMIT</span><h2>Um fluxo natural.</h2></div><button className="text-link" onClick={() => navigate('arquitetura')}>Conheça a arquitetura<ArrowRight size={16} /></button></div>
      <ol className="execution-flow">{[
        ['01', 'PR aberto', 'O evento inicia a Action.', GitPullRequest], ['02', 'Análise', 'Três detectores entram em ação.', ScanLine], ['03', 'Correções', 'Arquivos no caminho certo.', FolderTree], ['04', 'Imports', 'Referências acompanham.', Code2], ['05', 'Commit', 'Mudanças voltam ao PR.', GitCommitHorizontal], ['06', 'Relatório', 'Você vê o que mudou.', MessageSquareText],
      ].map(([n, title, text, Icon]) => { const IconComponent = Icon as typeof ScanLine; return <li key={String(n)}><span className="flow-step"><IconComponent size={20} /></span><small>{String(n)}</small><h3>{String(title)}</h3><p>{String(text)}</p></li>; })}</ol>
      <p className="section-note">As etapas de correção e commit são ativadas em <code>mode: fix</code>, para PRs do mesmo repositório.</p>
    </section>
    <section className="evolution-panel"><div><span className="kicker">EVOLUÇÃO, NA PRÁTICA</span><h2>Detectar foi<br />só o começo.</h2><p>A versão 2.0 leva a organização<br />até o próximo commit.</p></div><div className="comparison-table"><div className="comparison-row comparison-head"><span>Capacidade</span><span>v1.0</span><span className="version-tag">v2.0</span></div>{[['Encontrar problemas', 'Detecta', 'Detecta'], ['Corrigir caminhos', 'Manual', 'Automático'], ['Atualizar imports', 'Manual', 'Automático'], ['Registrar no PR', 'Relatório', 'Commit + relatório']].map(([label, before, after]) => <div className="comparison-row" key={label}><span>{label}</span><span>{before}</span><span><Check size={14} />{after}</span></div>)}</div></section>
    <section className="closing-cta"><div className="eyebrow"><span />COMECE PELO PRÓXIMO PR</div><h2>Deixe a organização<br /><span className="gradient-text">seguir seu ritmo.</span></h2><button className="button button-primary" onClick={() => navigate('setup')}>Configurar a Action<ArrowRight size={16} /></button></section>
  </>;
}

export function Examples({ navigate }: { navigate: Navigate }) {
  const [selected, setSelected] = useState(0);
  const example = examples[selected];
  return <div className="page-content"><SectionHeading eyebrow="VEJA A TRANSFORMAÇÃO" title={<>Pequenas mudanças.<br /><span className="muted-heading">Uma revisão melhor.</span></>} description="Explore quatro situações comuns e veja como a Action organiza cada uma. Exemplos ilustrativos, com o código por trás à sua disposição." />
    <div className="segmented-control examples-control" aria-label="Escolher exemplo">{examples.map((item, index) => <button key={item.id} aria-pressed={selected === index} className={selected === index ? 'selected' : ''} onClick={() => setSelected(index)}>{item.label}</button>)}</div>
    <div className="example-heading" key={example.id}><div><h2>{example.title}</h2><p>{example.description}</p></div><span className="result-badge"><CheckCircle2 size={15} />{example.result}</span></div>
    <div className="diff-grid"><div className="diff-panel before-panel"><div className="panel-toolbar"><span><i />Antes</span><CopyButton value={example.before} label="Copiar exemplo antes" /></div><CodeBlock code={example.before} language={example.language} /></div><span className="diff-connector" aria-hidden="true"><ArrowRight size={20} /></span><div className="diff-panel after-panel"><div className="panel-toolbar"><span><i />Depois</span><CopyButton value={example.after} label="Copiar exemplo depois" /></div><CodeBlock code={example.after} language={example.language} /></div></div>
    <p className="example-footnote"><ShieldCheck size={15} />{example.detail}</p>
    <section className="report-section"><div className="section-intro"><div><span className="kicker">CLAREZA PARA QUEM REVISA</span><h2>Um comentário.<br />A história completa.</h2></div><p>O relatório fica no seu pull request,<br />com cada alteração à vista.</p></div>
      <article className="pr-report"><div className="report-author"><span className="bot-avatar"><Workflow size={21} /></span><strong>github-actions<span>[bot]</span></strong><span className="small-badge">Exemplo de relatório</span></div><div className="report-body"><h3><Sparkles size={20} />Auto-Organizer v2.0</h3><p>Correções commitadas no PR.</p><div className="report-stats"><span><strong>3</strong> arquivos movidos</span><span><strong>2</strong> arquivos com imports atualizados</span></div><div className="table-scroll"><table><thead><tr><th>Antes</th><th>Depois</th><th>Resultado</th></tr></thead><tbody>{[['src/Components/Button.tsx','src/components/Button.tsx'],['src/utlis/format.ts','src/utils/format.ts'],['src/useTheme.ts','src/hooks/useTheme.ts']].map(([before, after]) => <tr key={before}><td><code>{before}</code></td><td><code>{after}</code></td><td><span className="inline-success"><Check size={13} />Corrigido</span></td></tr>)}</tbody></table></div><p className="report-note">Reexecute os testes do projeto após aplicar as correções.</p></div></article>
      <button className="text-link" onClick={() => navigate('codigo', 'src/index.js')}>Explore a geração do relatório<ArrowRight size={16} /></button>
    </section>
  </div>;
}

export function CodeExplorer({ initialFile }: { initialFile: string }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [selected, setSelected] = useState(initialFile);
  const editor = useRef<HTMLDivElement>(null);
  const file = files.find(file => file.path === selected) || files[0];
  useEffect(() => { setSelected(initialFile); }, [initialFile]);
  useEffect(() => { editor.current?.scrollTo({ top: 0, left: 0 }); }, [selected]);
  const visible = files.filter(file => (category === 'Todos' || file.category === category) && (file.path + ' ' + file.description).toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  function download() {
    const url = URL.createObjectURL(new Blob([file.content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = file.path.split('/').pop()!; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="page-content"><SectionHeading eyebrow="ABERTO PARA EXPLORAR" title={<>Cada linha.<br /><span className="muted-heading">À sua disposição.</span></>} description="Os 14 arquivos da Action, completos e comentados. Explore os módulos, copie o que precisar e entenda como tudo funciona." />
    <div className="code-workspace"><aside className="file-sidebar" aria-label="Arquivos da Action"><div className="sidebar-title"><Folder size={16} /><strong>auto-organizer</strong><span>14</span></div><div className="file-search"><Search size={15} /><input aria-label="Buscar arquivos" placeholder="Buscar arquivos…" value={query} onChange={event => setQuery(event.target.value)} />{query && <button aria-label="Limpar busca de arquivos" onClick={() => setQuery('')}><X size={13} /></button>}</div><div className="file-categories">{['Todos','Código','Config','Docs'].map(item => <button key={item} aria-pressed={category === item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="file-list">{visible.map(item => <button key={item.path} className={'file-item ' + (file.path === item.path ? 'active' : '')} aria-current={file.path === item.path ? 'true' : undefined} onClick={() => setSelected(item.path)} title={item.path}>{item.category === 'Código' ? <FileCode2 size={16} /> : item.language === 'json' ? <FileJson2 size={16} /> : <FileText size={16} />}<span>{item.path}</span>{file.path === item.path && <span className="file-active-dot" />}</button>)}{visible.length === 0 && <p className="empty-state">Nenhum arquivo encontrado.</p>}</div><div className="file-sidebar-footer"><ShieldCheck size={14} /><span>Código local · Licença MIT</span></div></aside>
      <section className="editor-panel" aria-label="Código do arquivo selecionado"><div className="editor-toolbar"><div><FileCode2 size={16} /><span>{file.path}</span></div><div><span className="language-label">{file.language}</span><button className="icon-button" onClick={download} aria-label="Baixar arquivo selecionado" title="Baixar arquivo"><ArrowDownToLine size={15} /></button><CopyButton value={file.content} label="Copiar arquivo selecionado" /></div></div><div className="editor-description">{file.description}</div><div className="editor-content" ref={editor} tabIndex={0}><CodeBlock code={file.content} language={file.language} numbers /></div><div className="editor-status"><span><span className="status-dot" />{file.content.trimEnd().split('\n').length} linhas</span><span>UTF-8 <i />{file.language === 'javascript' ? 'JavaScript' : file.language.toUpperCase()}</span></div></section>
    </div>
    <details className="project-tree"><summary><FolderTree size={18} /><span>Estrutura do projeto</span><ChevronDown size={17} /></summary><div><CopyButton value={projectTree} label="Copiar estrutura do projeto" /><pre>{projectTree}</pre></div></details>
  </div>;
}

export function Architecture({ navigate }: { navigate: Navigate }) {
  const [mode, setMode] = useState<'fix'|'report'>('fix');
  const modules = [
    { icon: ScanLine, name: 'Detectores', file: 'src/detector.js', text: 'Case, typos e estrutura.', number: '01' },
    { icon: FolderTree, name: 'Corretor', file: 'src/fixer.js', text: 'Movimentos com git mv.', number: '02' },
    { icon: Code2, name: 'Imports', file: 'src/import-updater.js', text: 'Referências atualizadas.', number: '03' },
    { icon: GitBranch, name: 'Git', file: 'src/git-ops.js', text: 'Commit e push no PR.', number: '04' },
  ];
  return <div className="page-content"><SectionHeading eyebrow="ENGENHARIA COM CLAREZA" title={<>Seis módulos.<br /><span className="muted-heading">Um fluxo conectado.</span></>} description="Responsabilidades bem definidas, da configuração ao commit. Toque em um módulo para explorar seu código." />
    <div className="architecture-panel"><div className="architecture-toolbar"><span><Workflow size={16} />Mapa da Action</span><div className="segmented-control small" aria-label="Modo da arquitetura"><button aria-pressed={mode === 'fix'} className={mode === 'fix' ? 'selected' : ''} onClick={() => setMode('fix')}>fix</button><button aria-pressed={mode === 'report'} className={mode === 'report' ? 'selected' : ''} onClick={() => setMode('report')}>report</button></div></div>
      <div className="architecture-root"><button className="module-card config-module" onClick={() => navigate('codigo', 'src/conventions.js')}><Settings2 size={21} /><strong>Convenções</strong><code>conventions.js</code><span>As regras do seu projeto</span></button><ArrowRight className="config-arrow" size={22} /><button className="module-card orchestrator" onClick={() => navigate('codigo', 'src/index.js')}><span className="module-symbol"><Layers3 size={25} /></span><div><strong>Orquestrador</strong><code>index.js</code><span>Conecta o evento ao resultado.</span></div><ArrowUpRight size={16} /></button></div>
      <div className="architecture-connector" aria-hidden="true"><span /><ArrowDown size={19} /></div><div className="module-grid">{modules.map(({ icon: Icon, ...item }, index) => <button className={'module-card ' + (mode === 'report' && index > 0 ? 'module-idle' : '')} key={item.file} onClick={() => navigate('codigo', item.file)}><span className="module-number">{item.number}</span><Icon size={24} /><strong>{item.name}</strong><code>{item.file.replace('src/','')}</code><span>{mode === 'report' && index > 0 ? 'Não executado em report' : item.text}</span><ArrowUpRight className="module-open" size={14} /></button>)}</div><p className="architecture-caption" role="status">{mode === 'fix' ? 'O plano segue para correção, atualização de imports e commit. O orquestrador publica o relatório.' : 'Os detectores produzem o plano e o orquestrador publica o relatório. Nenhum arquivo é alterado.'}</p>
    </div>
    <div className="architecture-details"><section className="info-card"><div className="card-heading"><ShieldCheck size={20} /><h2>Permissões com propósito.</h2></div><p>O workflow declara as permissões que utiliza.</p><div className="permission-row"><code>contents: write</code><span>Enviar o commit à branch do PR.</span></div><div className="permission-row"><code>pull-requests: write</code><span>Publicar o relatório no PR.</span></div><div className="inline-note">PRs de forks ficam em modo relatório. Se o comentário não for permitido, o resumo permanece no job.</div></section><section className="info-card"><div className="card-heading"><Terminal size={20} /><h2>Uma base conhecida.</h2></div><p>Ferramentas que já fazem parte do seu fluxo.</p><div className="stack-tags"><span>Node.js 24</span><span>GitHub Actions SDK</span><span>Git</span><span>TypeScript AST</span><span>ncc</span><span>Ubuntu</span></div><div className="inline-note">O bundle da Action é gerado com ncc. A interface de documentação usa React, TypeScript, Vite e Tailwind.</div></section></div>
  </div>;
}

export function Setup({ navigate }: { navigate: Navigate }) {
  const [repository, setRepository] = useState('seu-usuario/auto-organizer');
  const [mode, setMode] = useState<'report'|'fix'>('report');
  const validRepository = /^[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9_.-]+$/.test(repository.trim());
  const workflow = workflowSource.replaceAll('YOUR_OWNER/auto-organizer', validRepository ? repository.trim() : 'YOUR_OWNER/auto-organizer').replace('mode: report', 'mode: ' + mode);
  return <div className="page-content"><SectionHeading eyebrow="SEU PRÓXIMO PASSO" title={<>Uma configuração.<br /><span className="gradient-text">Um novo fluxo.</span></>} description="Publique sua Action, configure o workflow e experimente em um PR de teste. Comece em modo relatório para conhecer as mudanças." />
    <div className="setup-layout"><div className="setup-steps">{[
      { number: '01', title: 'Prepare o código.', text: 'No diretório da Action, instale as dependências. Os 14 arquivos estão disponíveis na aba Código.', command: 'npm install' },
      { number: '02', title: 'Gere o bundle.', text: 'O GitHub executa dist/index.js. Inclua esse bundle e as licenças na versão publicada.', command: 'npm run build' },
      { number: '03', title: 'Publique a versão.', text: 'Em um repositório próprio, já conectado ao seu GitHub, versione os arquivos e crie a tag v2.', command: 'git add .\ngit add -f dist/index.js dist/licenses.txt\ngit commit -m "Release Auto-Organizer v2.0"\ngit tag v2\ngit push origin HEAD --tags' },
    ].map(step => <article className="setup-step" key={step.number}><span className="step-number">{step.number}</span><div><h2>{step.title}</h2><p>{step.text}</p><div className="command-block"><CopyButton value={step.command} label={'Copiar comando ' + step.number} compact /><pre>{step.command}</pre></div></div></article>)}<div className="setup-note"><BookOpen size={19} /><div><strong>Publicando pela primeira vez?</strong><p>Consulte o guia completo, os inputs e os limites de atualização de imports.</p><button className="text-link" onClick={() => navigate('codigo', 'README.md')}>Ler a documentação<ArrowUpRight size={14} /></button></div></div></div>
      <section className="workflow-config"><div className="card-heading"><Workflow size={20} /><h2>Seu workflow, pronto para copiar.</h2></div><label htmlFor="action-repository">Repositório da Action</label><input id="action-repository" className="text-input" value={repository} onChange={event => setRepository(event.target.value)} aria-invalid={!validRepository} aria-describedby="repository-help" spellCheck={false} /><p id="repository-help" className={validRepository ? 'field-hint' : 'field-hint input-error'}>{validRepository ? 'Use o repositório onde você publicou a Action e a tag v2.' : 'Informe no formato usuario/repositorio.'}</p><div className="mode-picker"><span>Modo de execução</span><div className="segmented-control small"><button className={mode === 'report' ? 'selected' : ''} aria-pressed={mode === 'report'} onClick={() => setMode('report')}>report</button><button className={mode === 'fix' ? 'selected' : ''} aria-pressed={mode === 'fix'} onClick={() => setMode('fix')}>fix</button></div></div><p className="field-hint">{mode === 'report' ? 'Detecta e relata. Bom para a primeira execução.' : 'Corrige e envia commits em PRs do mesmo repositório.'}</p><div className="workflow-code"><div className="panel-toolbar"><span><FileCode2 size={14} />auto-organizer.yml</span><CopyButton value={workflow} label="Copiar workflow configurado" /></div><CodeBlock code={workflow} language="yaml" numbers /></div><p className="field-hint workflow-destination">Salve em <code>.github/workflows/auto-organizer.yml</code> no projeto consumidor.</p></section></div>
    <div className="setup-bottom"><div><ShieldCheck size={20} /><h3>Um checkout limpo.</h3><p>Execute a Action antes de builds ou geração de código, com checkout do SHA do PR.</p></div><div><GitBranch size={20} /><h3>As políticas continuam.</h3><p>Permissões e proteção de branches se aplicam. A Action não faz force-push.</p></div><div><CheckCircle2 size={20} /><h3>Valide no seu projeto.</h3><p>Depois das correções, execute seus testes. A publicação da Action é feita no seu GitHub.</p></div></div>
  </div>;
}
