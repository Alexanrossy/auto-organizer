import manifest from '../../action/action.yml?raw';
import pkg from '../../action/package.json?raw';
import entry from '../../action/src/index.js?raw';
import detector from '../../action/src/detector.js?raw';
import fixer from '../../action/src/fixer.js?raw';
import imports from '../../action/src/import-updater.js?raw';
import git from '../../action/src/git-ops.js?raw';
import conventions from '../../action/src/conventions.js?raw';
import dictionary from '../../action/src/typos-dictionary.js?raw';
import config from '../../action/.organizer.json?raw';
import workflow from '../../action/.github/workflows/auto-organizer.yml?raw';
import readme from '../../action/README.md?raw';
import ignore from '../../action/.gitignore?raw';
import license from '../../action/LICENSE?raw';

export type CodeFile = { path: string; language: string; category: 'Código' | 'Config' | 'Docs'; description: string; content: string };
export const files: CodeFile[] = [
  { path: 'action.yml', language: 'yaml', category: 'Config', description: 'O contrato da Action. Inputs, outputs e runtime.', content: manifest },
  { path: 'package.json', language: 'json', category: 'Config', description: 'Dependências, build e testes.', content: pkg },
  { path: 'src/index.js', language: 'javascript', category: 'Código', description: 'Do evento do PR ao relatório final.', content: entry },
  { path: 'src/detector.js', language: 'javascript', category: 'Código', description: 'Três detectores. Um único plano de correção.', content: detector },
  { path: 'src/fixer.js', language: 'javascript', category: 'Código', description: 'Movimentos via git mv, com verificação de colisões.', content: fixer },
  { path: 'src/import-updater.js', language: 'javascript', category: 'Código', description: 'Reescrita de imports com análise de sintaxe.', content: imports },
  { path: 'src/git-ops.js', language: 'javascript', category: 'Código', description: 'Stage, commit e push para a branch do PR.', content: git },
  { path: 'src/conventions.js', language: 'javascript', category: 'Código', description: 'Suas regras de organização, em JSON.', content: conventions },
  { path: 'src/typos-dictionary.js', language: 'javascript', category: 'Código', description: 'Dicionário de erros comuns em nomes de caminhos.', content: dictionary },
  { path: '.organizer.json', language: 'json', category: 'Config', description: 'Pastas, aliases, exclusões e regras de estrutura.', content: config },
  { path: '.github/workflows/auto-organizer.yml', language: 'yaml', category: 'Config', description: 'Workflow de referência para o projeto consumidor.', content: workflow },
  { path: 'README.md', language: 'markdown', category: 'Docs', description: 'Instalação, publicação, comportamento e limites.', content: readme },
  { path: '.gitignore', language: 'bash', category: 'Config', description: 'Arquivos locais que não entram na versão da Action.', content: ignore },
  { path: 'LICENSE', language: 'text', category: 'Docs', description: 'Licença MIT.', content: license },
];

export const workflowSource = workflow;
export const projectTree = `auto-organizer/
├── action.yml
├── package.json
├── .organizer.json
├── src/
│   ├── index.js
│   ├── detector.js
│   ├── fixer.js
│   ├── import-updater.js
│   ├── git-ops.js
│   ├── conventions.js
│   └── typos-dictionary.js
├── .github/workflows/
│   └── auto-organizer.yml
├── README.md
├── .gitignore
└── LICENSE`;

export const examples = [
  { id: 'case', label: 'Case conflict', title: 'A mesma pasta. Uma só escrita.', description: 'Padronize diretórios com letras maiúsculas divergentes. Os imports acompanham a mudança.', language: 'bash', before: 'src/\n├── Components/\n│   └── Button.tsx\n└── components/\n    └── Input.tsx', after: 'src/\n└── components/\n    ├── Button.tsx\n    └── Input.tsx', result: 'Pastas unificadas', detail: 'Se dois arquivos ocuparem o mesmo destino, a Action pede revisão manual.' },
  { id: 'typo', label: 'Typos', title: 'Um pequeno erro. Já corrigido.', description: 'Um dicionário de mais de 70 erros conhecidos cuida dos nomes que passam despercebidos.', language: 'bash', before: 'src/\n├── compontents/\n│   └── Buton.tsx\n├── utlis/\n│   └── format.ts\n└── servcies/\n    └── api.ts', after: 'src/\n├── components/\n│   └── Button.tsx\n├── utils/\n│   └── format.ts\n└── services/\n    └── api.ts', result: 'Nomes consistentes', detail: 'As correções usam palavras conhecidas, sem substituir trechos arbitrários dos nomes.' },
  { id: 'structure', label: 'Estrutura', title: 'Cada arquivo encontra seu lugar.', description: 'Suas convenções definem a estrutura. A Action aplica as regras de movimentação.', language: 'bash', before: 'src/\n├── useTheme.ts\n├── useSession.ts\n└── utils.test.ts', after: 'src/\n├── hooks/\n│   ├── useTheme.ts\n│   └── useSession.ts\n└── tests/\n    └── utils.test.ts', result: 'Estrutura organizada', detail: 'Este exemplo usa as regras explícitas de .organizer.json incluídas no projeto.' },
  { id: 'imports', label: 'Imports', title: 'Mudou de lugar. Continua conectado.', description: 'Imports relativos, aliases e reexports são atualizados junto com os arquivos.', language: 'javascript', before: 'import Button from "@/Components/Button";\nimport { format } from "./utlis/format";\n\nconst api = require("./servcies/api");\nexport { useTheme } from "./useTheme";', after: 'import Button from "@/components/Button";\nimport { format } from "./utils/format";\n\nconst api = require("./services/api");\nexport { useTheme } from "./hooks/useTheme";', result: 'Referências atualizadas', detail: 'A análise usa sintaxe JavaScript/TypeScript. Imports calculados não são reescritos.' },
];
