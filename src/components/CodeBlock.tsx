import { useEffect, useRef, useState } from 'react';
import { Check, Copy, AlertCircle } from 'lucide-react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import oneDark from 'react-syntax-highlighter/dist/esm/styles/prism/one-dark';

SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('markdown', markdown);

export function CopyButton({ value, label = 'Copiar código', compact = false }: { value: string; label?: string; compact?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copy() {
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(value);
      else {
        const input = document.createElement('textarea');
        input.value = value;
        input.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
        document.body.appendChild(input);
        input.select();
        const success = document.execCommand('copy');
        input.remove();
        if (!success) throw new Error('Clipboard unavailable');
      }
      setStatus('copied');
    } catch { setStatus('error'); }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus('idle'), 2500);
  }
  return <button type="button" className={'copy-button ' + (status === 'copied' ? 'is-copied' : '')} onClick={copy} aria-label={status === 'copied' ? 'Código copiado' : label} title={label}>
    {status === 'copied' ? <Check size={15} /> : status === 'error' ? <AlertCircle size={15} /> : <Copy size={15} />}
    {!compact && <span aria-live="polite">{status === 'copied' ? 'Copiado!' : status === 'error' ? 'Selecione para copiar' : 'Copiar'}</span>}
  </button>;
}

export function CodeBlock({ code, language = 'javascript', numbers = false }: { code: string; language?: string; numbers?: boolean }) {
  return <SyntaxHighlighter language={language === 'text' ? undefined : language} style={oneDark} showLineNumbers={numbers} customStyle={{ margin: 0, padding: '24px', background: 'transparent', fontSize: '13px', lineHeight: '1.9' }} codeTagProps={{ style: { fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace' } }} lineNumberStyle={{ minWidth: '3em', paddingRight: '1.5em', color: '#60616d', userSelect: 'none' }}>
    {code.trimEnd()}
  </SyntaxHighlighter>;
}
