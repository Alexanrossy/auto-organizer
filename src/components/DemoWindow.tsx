import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, CheckCheck, Circle, FileCode2, Folder, GitPullRequest, Play, RotateCcw, Sparkles } from 'lucide-react';

export function DemoWindow({ trigger }: { trigger: number }) {
  const [phase, setPhase] = useState<'before' | 'running' | 'after'>('before');
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const lastTrigger = useRef(trigger);
  function run() {
    clearTimeout(timer.current);
    setPhase('running');
    timer.current = setTimeout(() => setPhase('after'), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 80 : 1400);
  }
  useEffect(() => {
    if (lastTrigger.current !== trigger) { lastTrigger.current = trigger; run(); }
    return () => clearTimeout(timer.current);
  }, [trigger]);
  const done = phase === 'after';
  return <div className="hero-visual">
    <div className="ambient-orb" aria-hidden="true" />
    <div className="window-backplate" aria-hidden="true" />
    <div className={'demo-window ' + (done ? 'demo-complete' : '')}>
      <div className="window-toolbar"><div className="window-dots" aria-hidden="true"><i /><i /><i /></div><span>acme / storefront</span><span className="demo-label">DEMO</span></div>
      <div className="pr-heading"><div className="pr-icon"><GitPullRequest size={23} /></div><div><strong>Um PR. Tudo no lugar.</strong><p>feat: new storefront <span>#128</span></p></div><span className="branch-label">main</span></div>
      <div className="change-label"><span>ARQUIVOS DO PROJETO</span><span>{done ? '3 correções' : '3 ajustes'}</span></div>
      <div className="file-changes">
        {[
          { before: 'src/Components/', after: 'src/components/', tag: 'Case conflict', icon: Folder },
          { before: 'src/utlis/format.ts', after: 'src/utils/format.ts', tag: 'Typo', icon: FileCode2 },
          { before: 'src/useTheme.ts', after: 'src/hooks/useTheme.ts', tag: 'Estrutura', icon: FileCode2 },
        ].map(({ before, after, tag, icon: Icon }, index) => <div className="file-change" key={before} style={{ '--delay': index * 90 + 'ms' } as React.CSSProperties}>
          <Icon size={17} /><span className="file-path">{done ? after : before}</span><span className={'change-tag ' + (done ? 'tag-fixed' : '')}>{done ? <><Check size={12} /> Corrigido</> : tag}</span>
        </div>)}
      </div>
      <div className="import-preview"><span className="code-keyword">import</span> Button <span className="code-keyword">from</span><br /><span className={done ? 'code-path fixed-path' : 'code-path'}>"@/{done ? 'components' : 'Components'}/Button";</span><span className="import-caption">{done ? <><CheckCheck size={12} /> Import atualizado</> : 'Imports também acompanham a mudança'}</span></div>
      <div className="demo-footer"><span className={'demo-status ' + (phase === 'running' ? 'is-running' : '')} role="status">{done ? <Check size={14} /> : phase === 'running' ? <Circle size={11} /> : <Circle size={7} fill="currentColor" />}{done ? 'Simulação concluída' : phase === 'running' ? 'Organizando os arquivos…' : 'Pronto para organizar'}</span><button type="button" onClick={run} disabled={phase === 'running'} className="demo-run" aria-label={done ? 'Repetir demonstração' : 'Executar demonstração'}>{done ? <RotateCcw size={14} /> : <Play size={13} fill="currentColor" />}</button></div>
    </div>
    <div className="floating-note"><span className="floating-icon"><Sparkles size={17} /></span><div><strong>Menos trabalho repetitivo.</strong><span>Mais espaço para criar.</span></div><ArrowRight size={16} /></div>
    <p className="simulation-caption">Prévia ilustrativa. Nenhum repositório é alterado nesta demonstração.</p>
  </div>;
}
