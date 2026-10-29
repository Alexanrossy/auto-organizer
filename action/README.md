# Auto-Organizer v2.0

GitHub Action para organizar caminhos em pull requests, atualizar imports e
registrar as correções em um commit. Usa `git mv` e não sobrescreve destinos existentes.

## Publicar a Action

O repositório reúne o app de documentação na raiz e a Action neste diretório
`action/`. O lockfile da raiz inclui as dependências de ambos os projetos.

1. Na raiz do repositório, execute `npm ci` e `npm test`.
2. Execute `npm run build:action` para gerar o bundle.
3. Versione o código, `package-lock.json`, `action/dist/index.js` e
   `action/dist/licenses.txt`. O GitHub executa esse bundle sem instalar dependências.
4. Publique a branch `main` no seu repositório `auto-organizer`.
5. Valide em um PR de teste usando `YOUR_OWNER/auto-organizer/action@main`.
6. Depois da validação, crie e envie a tag `v2` para usar o workflow de referência.

A criação do repositório não cria automaticamente a tag `v2`. O segmento
`/action` na referência `uses` é necessário para encontrar o manifesto neste diretório.

O runtime é Node.js 24 e o workflow de referência usa Ubuntu. O bundle é gerado
com ncc. A execução real pela API GitHub exige um PR e as permissões do consumidor.

## Configurar o consumidor

Copie `.github/workflows/auto-organizer.yml` para o projeto consumidor.
Substitua `YOUR_OWNER` pelo proprietário da Action. O checkout precisa apontar
para `github.event.pull_request.head.sha` e permitir persistência de credenciais.
Habilite permissões `contents: write` e `pull-requests: write` no workflow e
verifique as políticas da organização. Comece com `mode: report`; depois use
`mode: fix` para autorizar commits automáticos em PRs do mesmo repositório.

PRs de forks permanecem em modo relatório. Se o token não puder comentar,
o relatório fica no resumo do job. Não use `pull_request_target` para executar
código não confiável do PR com um token de escrita.

## O que é corrigido

- Diretórios conhecidos com capitalização divergente e pastas que conflitam por case.
- Palavras de nomes de arquivo/pasta presentes no dicionário de mais de 70 typos.
- Regras explícitas de estrutura em `.organizer.json`; não há movimentação por heurística de conteúdo.
- Imports estáticos, reexports, `require('...')` e `import('...')` literais.
- Caminhos relativos, aliases de `.organizer.json` e `compilerOptions.paths` do tsconfig raiz.

Os detectores são executados em paralelo e seus resultados formam um plano único.
A análise considera arquivos do PR e diretórios relacionados. Consumidores de imports
são examinados no checkout inteiro. Destinos existentes ou ambíguos exigem revisão manual.
Links simbólicos não são movimentados. O checkout deve estar limpo antes da correção.

Imports calculados, literais dentro de templates e aliases definidos somente em
bundlers ou tsconfigs herdados não são reescritos. Configure esses aliases no
`.organizer.json`. A Action não altera automaticamente configurações de ferramentas.
Rode os testes do projeto após as mudanças. Regras de proteção podem impedir o push;
a Action não faz force-push nem ignora essas políticas.

## Inputs

| Input | Padrão | Finalidade |
| --- | --- | --- |
| github-token | github.token | API de PRs e comentários; o push usa a autenticação do checkout |
| mode | report | report ou fix |
| fix-case-conflicts | true | Normalizar diretórios |
| fix-typos | true | Corrigir typos conhecidos |
| fix-structure | true | Aplicar regras de estrutura |
| update-imports | true | Reescrever imports afetados |
| commit-message | chore: organize files and update imports | Mensagem do commit |
| conventions-file | .organizer.json | Arquivo JSON relativo ao checkout |

## Outputs

`files-fixed`: arquivos distintos movidos ou com imports alterados.
`files-renamed`: arquivos efetivamente movidos.
`folders-unified`: diretórios de origem normalizados por case.
`comment-url`: URL do comentário, ou vazio quando ele não puder ser publicado.
Em modo relatório, os contadores de correções são zero.

## Convenções

`folders` define nomes de diretórios em minúsculas. `ignore` exclui arquivos dos
detectores. `aliases` usa o formato de paths do TypeScript. `structure` contém
pares `pattern`/`destination`; a primeira regra aplicável vence. Os padrões aceitam
`*`, `**` e `?`. Não use caminhos absolutos nem `..`. A configuração é apenas JSON,
sem execução de código.

## Validação e licença

`npm test` executa os testes locais, incluindo fixtures de Git e resolução de imports.
`npm run build` gera o bundle para distribuição. Testes locais não equivalem a uma
execução em PR real nem verificam permissões da sua organização.

MIT. Consulte LICENSE.
