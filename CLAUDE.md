# CLAUDE.md — Instruções de Projeto

## Regra de Ouro

NUNCA faça alterações diretamente na branch `main`. Toda mudança deve ser feita em uma branch dedicada, testada e mergeada via Pull Request.

## Fluxo de Desenvolvimento Obrigatório

### 1. Antes de codar

- Pergunte em qual melhoria/feature vou trabalhar
- Crie (ou mude para) uma branch com nome descritivo: `melhoria/nome-curto`
- Confirme a branch ativa antes de qualquer alteração

### 2. Durante o desenvolvimento

- Faça commits pequenos e frequentes com mensagens claras em português
- Formato do commit: `tipo: descrição curta` (ex: `feat: adiciona filtro de busca`, `fix: corrige cálculo de frete`)
- Rode os testes após cada mudança significativa
- Se não existirem testes para o código alterado, crie antes de prosseguir

### 3. Antes de abrir PR

- Rode a suite completa de testes
- Verifique se não há erros de lint
- Faça um self-review das mudanças (`git diff main`)
- Garanta que a branch está atualizada com a main

### 4. Pull Request

- Abra o PR via `gh pr create`
- Título claro e descrição explicando: o que mudou, por que mudou, como testar
- Não faça merge automático — espere minha aprovação

## Testes

- Comando para rodar testes: `npm test` (⚠️ ainda não configurado — configurar Vitest ou Jest como primeira tarefa)
- Comando para lint: `npm run lint` (⚠️ ainda não configurado — adicionar ESLint ao projeto)
- Cobertura mínima esperada: 80%

## Stack do Projeto

- **Linguagem:** JavaScript (ES Modules)
- **Framework:** Next.js 14 (App Router)
- **Banco de dados:** Supabase (PostgreSQL com RLS)
- **Deploy:** Vercel
- **Estilização:** CSS puro (globals.css)
- **Dependências principais:** React 18, @supabase/supabase-js

## Estrutura do Projeto

```
rede-parque-dos-sinos/
├── app/
│   ├── page.js              → Página inicial (landing)
│   ├── layout.js             → Layout raiz (metadata, fonts, Nav + Footer)
│   ├── globals.css            → Estilos globais
│   ├── config.js              → Categorias de serviços
│   ├── catalogo/page.js       → Catálogo com busca e filtros
│   ├── cadastro/page.js       → Formulário de cadastro de profissional
│   ├── avaliar/page.js        → Formulário de avaliação
│   ├── sobre/page.js          → Sobre a rede
│   └── components/
│       ├── Nav.js             → Navbar
│       ├── Footer.js          → Rodapé
│       └── FeedbackButton.js  → Botão de feedback (bugs/melhorias)
├── lib/
│   └── supabase.js            → Cliente Supabase
├── supabase-setup.sql         → Schema do banco de dados
├── next.config.js
├── package.json
└── .env.local.example
```

## Banco de Dados (Supabase)

Tabelas principais:

- **profissionais** — cadastro dos prestadores de serviço (nome, telefone, servico, categoria, bairro, regioes, instagram, experiencia, descricao)
- **avaliacoes** — avaliações dos profissionais (pontual, novamente, conforme, nota 1-5, comentario)
- **feedback** — bugs e sugestões dos usuários (tipo, mensagem, pagina)

Todas com RLS habilitado e políticas de leitura/inserção pública.

## Variáveis de Ambiente

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

Copiar `.env.local.example` para `.env.local` e preencher com as credenciais do Supabase.

## Convenções

- Idioma do código: português (nomes de variáveis, tabelas, componentes)
- Idioma dos commits e PRs: português
- Quando houver dúvida sobre a abordagem, apresente as opções antes de implementar
- Categorias de serviço definidas em `app/config.js`

## Pendências Técnicas Conhecidas

### Concluídas

- [x] Configurar ESLint + Prettier (`npm run lint`, `npm run format` — `eslint-config-next` + Prettier)
- [x] Configurar framework de testes (Vitest + Testing Library — `npm test` / `npm run test:run`)
- [x] Configurar repositório Git remoto (GitHub — `leonardocobra/rede-parque-dos-sinos`)
- [x] Adicionar Tailwind CSS (migração do CSS puro concluída — tokens `brand-*`)

### Em aberto

- [ ] Ampliar cobertura de testes em direção à meta de 80% (priorizar RLS de dono/claim e fluxos do `/painel`)
- [ ] Resolver a instabilidade do e-mail/Magic Link do Supabase que bloqueia o login E2E
- [ ] Cliente Supabase já migrado para `@supabase/ssr`; revisar redirect do Magic Link em produção (Vercel)
