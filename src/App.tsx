import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUp, ArrowUpRight, Layers3 } from 'lucide-react';
import { Architecture, CodeExplorer, Examples, Overview, Setup, type Tab } from './pages/Sections';

const tabs: { id: Tab; label: string }[] = [
  { id: 'visao-geral', label: 'Visão geral' },
  { id: 'antes-depois', label: 'Antes / Depois' },
  { id: 'codigo', label: 'Código' },
  { id: 'arquitetura', label: 'Arquitetura' },
  { id: 'setup', label: 'Setup' },
];
const fromHash = () => tabs.find(tab => '#' + tab.id === window.location.hash)?.id || 'visao-geral';

export default function App() {
  const [active, setActive] = useState<Tab>(fromHash);
  const [file, setFile] = useState('action.yml');
  const nav = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => { setActive(fromHash()); window.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  function navigate(tab: Tab, filename?: string) {
    if (filename) setFile(filename);
    setActive(tab);
    if (window.location.hash !== '#' + tab) window.location.hash = tab;
    window.scrollTo({ top: 0 });
  }
  return <div className="app-shell"><a className="skip-link" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Pular para o conteúdo</a>
    <header className="site-header"><div className="header-inner"><button className="brand" onClick={() => navigate('visao-geral')} aria-label="Auto-Organizer, início"><span className="brand-symbol"><Layers3 size={20} strokeWidth={1.6} /></span><strong>Auto-Organizer</strong><span className="version-chip">2.0</span></button>
      <div className="primary-nav" ref={nav} role="tablist" aria-label="Documentação" onKeyDown={event => {
        if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
        event.preventDefault();
        const current = tabs.findIndex(tab => tab.id === active);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        navigate(tabs[next].id);
        nav.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
      }}>{tabs.map(tab => <button key={tab.id} role="tab" id={'tab-' + tab.id} aria-selected={active === tab.id} aria-controls="main-content" tabIndex={active === tab.id ? 0 : -1} className={active === tab.id ? 'active' : ''} onClick={() => navigate(tab.id)}>{tab.label}</button>)}</div>
      <button className="header-cta" onClick={() => navigate('setup')}>Começar<ArrowUpRight size={14} /></button>
    </div></header>
    <main id="main-content" role="tabpanel" aria-labelledby={'tab-' + active} tabIndex={-1} className="main-container" key={active}>
      {active === 'visao-geral' && <Overview navigate={navigate} />}
      {active === 'antes-depois' && <Examples navigate={navigate} />}
      {active === 'codigo' && <CodeExplorer initialFile={file} />}
      {active === 'arquitetura' && <Architecture navigate={navigate} />}
      {active === 'setup' && <Setup navigate={navigate} />}
    </main>
    <footer className="site-footer"><div className="footer-inner"><div className="footer-brand"><Layers3 size={17} /><strong>Auto-Organizer</strong><span>Um lugar para cada detalhe.</span></div><div className="footer-links"><span>v2.0</span><button onClick={() => navigate('codigo', 'LICENSE')}>Licença MIT<ArrowUpRight size={12} /></button><button onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })} aria-label="Voltar ao topo"><ArrowUp size={16} /></button></div></div></footer>
  </div>;
}
