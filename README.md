# Rede de Profissionais – Parque dos Sinos

Plataforma comunitária para conectar moradores e prestadores de serviço.

## Setup completo (15 minutos)

### 1. Supabase (banco de dados gratuito)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Clique em **New Project** → dê o nome "rede-parque-dos-sinos"
3. Escolha uma senha e a região **South America (São Paulo)**
4. Aguarde o projeto ser criado (~2 min)
5. Vá em **SQL Editor** → clique em **New Query**
6. Cole o conteúdo do arquivo `supabase-setup.sql` e clique **Run**
7. Vá em **Settings → API** e copie:
   - **Project URL** (ex: https://xxx.supabase.co)
   - **anon public key** (a chave longa)

### 2. GitHub (repositório)

1. Acesse [github.com](https://github.com) e crie uma conta (se não tiver)
2. Clique em **New repository** → nome: `rede-parque-dos-sinos`
3. Faça upload de todos os arquivos deste projeto

### 3. Vercel (hospedagem gratuita)

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em **Add New Project** → importe o repositório
3. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = sua Project URL do Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = sua anon key do Supabase
4. Clique em **Deploy**
5. Pronto! Seu site estará no ar

## Estrutura

```
app/
├── page.js          → Página inicial
├── catalogo/page.js → Catálogo com busca e filtros
├── cadastro/page.js → Formulário de cadastro
├── avaliar/page.js  → Formulário de avaliação
├── sobre/page.js    → Sobre a rede
├── components/      → Nav e Footer
└── config.js        → Categorias
lib/
└── supabase.js      → Cliente Supabase
```
