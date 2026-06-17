# Plano técnico — PR B: Magic Link + sessão (SSR)

> Implementação. Recorte do `docs/painel-profissional-spec.md` (P0.2). **Depende do PR A**
> (migration aplicada + RLS). **Entrega**: profissional entra por link de e-mail e ganha uma
> sessão persistente; não inclui o `/painel` em si (isso é o PR C), apenas a infra de auth e uma
> tela `/entrar` que, ao autenticar, redireciona para `/painel` (que pode ser um stub neste PR).

## 1. Estado atual (ponto de partida)

- `lib/supabase.js` — **um único** `createClient` com a anon key. Usado em dois contextos:
  - client component: `app/cadastro/page.js` (`"use client"`);
  - server component: `lib/profissionais.js` (leitura pública do perfil).
- **Não há** sessão por cookie, middleware, nem callback de auth.
- Next 14 App Router; deploy Vercel; `next.config.js` vazio.

O `@supabase/supabase-js` puro guarda sessão em `localStorage` (só client). Para RLS por
`auth.uid()` funcionar **no servidor** (Server Components, Route Handlers, futuras Server Actions do
painel), a sessão precisa viver em **cookies** lidos no servidor. Isso é o que o `@supabase/ssr`
resolve. Por isso ele é pré-requisito do PR B.

## 2. Decisões técnicas

| Decisão                          | Escolha                                                  | Porquê                                                                                  |
| -------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Pacote de sessão                 | **`@supabase/ssr`**                                      | Padrão atual do Supabase p/ Next App Router; gerencia cookies server/client.            |
| Fluxo do link                    | **PKCE** (`signInWithOtp` + troca de `code` no callback) | Recomendado p/ SSR; o code exchange acontece no servidor.                               |
| Onde fica o `supabase-js` antigo | **Mantido** para as leituras públicas existentes         | Menor raio de impacto; `lib/profissionais.js` e `cadastro` seguem funcionando neste PR. |
| Site/redirect URL                | via env `NEXT_PUBLIC_SITE_URL`                           | Evita hardcode; difere dev × prod.                                                      |

## 3. Dependências e env

```bash
npm i @supabase/ssr
```

`.env.local` (+ `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=...        # já existe
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # já existe
NEXT_PUBLIC_SITE_URL=http://localhost:3000   # em prod: https://<dominio-vercel>
```

No **Supabase Studio → Authentication → URL Configuration**:

- **Site URL**: `https://<dominio-prod>`
- **Redirect URLs** (allowlist): `http://localhost:3000/auth/callback` e `https://<dominio-prod>/auth/callback`
- Em **Email templates → Magic Link**, garantir que o link aponte para `{{ .SiteURL }}/auth/callback?code=...` (template PKCE padrão do Supabase já faz isso).

## 4. Arquivos a criar/alterar

### Novos

**`lib/supabase/server.js`** — cliente server-side por requisição (lê/escreve cookies):

```js
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function getServerSupabase() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            /* chamado de Server Component: ok, o middleware renova */
          }
        },
      },
    }
  );
}
```

**`lib/supabase/client.js`** — cliente browser para components `"use client"` (login, futuro painel):

```js
import { createBrowserClient } from "@supabase/ssr";

export function getBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
```

**`middleware.js`** (raiz) — renova a sessão a cada navegação e propaga cookies:

```js
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  let res = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          res = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );
  await supabase.auth.getUser(); // dispara refresh do token se preciso
  return res;
}

export const config = {
  // roda nas rotas que precisam de sessão; evita assets estáticos
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

**`app/entrar/page.js`** (`"use client"`) — formulário de e-mail que dispara o magic link:

- `getBrowserSupabase().auth.signInWithOtp({ email, options: { emailRedirectTo: ${NEXT_PUBLIC_SITE_URL}/auth/callback } })`
- estados: idle → enviando → "Enviamos um link para seu e-mail" / erro.
- reaproveitar `Nav`, `Footer`, `inputClass` e estilos do `cadastro`.

**`app/auth/callback/route.js`** — Route Handler que troca o `code` por sessão e redireciona:

```js
import { NextResponse } from "next/server";
import { getServerSupabase } from "../../../lib/supabase/server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/painel";
  if (code) {
    const supabase = getServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/entrar?erro=link`);
}
```

**`app/painel/page.js`** — _stub_ mínimo neste PR (server component): se não houver usuário,
`redirect("/entrar")`; se houver, mostrar "Olá, <email>" + botão Sair. (A edição completa é o PR C.)

### Alterados

- **`app/components/Nav.js`** — adicionar link condicional "Entrar" / "Painel". Como Nav é client,
  ler a sessão via `getBrowserSupabase().auth.getSession()` em `useEffect` (ou um pequeno
  `AuthContext`). Manter simples: mostrar "Entrar" por padrão e "Painel" quando houver sessão.
- **`.env.local.example`** — adicionar `NEXT_PUBLIC_SITE_URL`.
- **`README` / docs** — registrar o passo de configurar Redirect URLs no Supabase.

> Nota: **não** migrar `lib/profissionais.js` nem `cadastro` para os novos clientes neste PR — fica
> como limpeza posterior. Reduz o risco de regressão na parte pública já em produção.

## 5. Fluxo ponta a ponta

```
/entrar  ──signInWithOtp(email, redirect=/auth/callback)──▶  e-mail com magic link
                                                                     │ clique
                                                                     ▼
                              /auth/callback?code=…  ──exchangeCodeForSession──▶ cookies de sessão
                                                                     │
                                                                     ▼
                                                           redirect /painel  (stub)
middleware renova a sessão em toda navegação seguinte
```

## 6. Critérios de aceite

- [ ] `npm i @supabase/ssr` adicionado ao `package.json`.
- [ ] Em `/entrar`, e-mail válido → mensagem de "link enviado"; e-mail inválido → erro inline.
- [ ] Clicar no link autentica e cai em `/painel` com a sessão ativa (cookie httpOnly presente).
- [ ] Recarregar `/painel` mantém a sessão (graças ao middleware).
- [ ] Link expirado/reusado → redireciona para `/entrar?erro=link` com aviso claro.
- [ ] "Sair" encerra a sessão e `/painel` volta a redirecionar para `/entrar`.
- [ ] **Não houve regressão**: catálogo, perfil público e cadastro anônimo seguem funcionando.
- [ ] Redirect URLs configuradas para dev e prod (checklist no doc/README).

## 7. Testes (Vitest — já no projeto)

- **Unit/integration** do callback: `code` ausente → redireciona a `/entrar?erro=link`; com `code`
  válido (mock do client) → redireciona a `/painel`.
- **`/entrar`** (Testing Library): submit chama `signInWithOtp` com o `emailRedirectTo` correto;
  estados de loading/erro renderizam.
- **Guard do `/painel`** (stub): sem usuário → `redirect` chamado.
- RLS de dono/claim é testada no **PR A/C** (precisa de dados), não aqui.

## 8. Riscos & mitigação

- **Cookies em Server Component**: `set` pode lançar fora de Route Handler/middleware — por isso o
  `try/catch` no `getServerSupabase` e o middleware como fonte de renovação. (Padrão oficial.)
- **Matcher do middleware** rodando em rotas demais → custo/latência. Mitigar com o `matcher` que
  exclui assets; revisar se precisa restringir a `/(painel|auth|entrar)`.
- **Dois clientes Supabase** convivendo (antigo + ssr) pode confundir. Documentar claramente e
  planejar a unificação como tech-debt (mover leituras p/ `lib/supabase/server`).
- **Deliverabilidade do magic link** (spam/SMTP do Supabase). Em prod, considerar SMTP próprio se a
  taxa de entrega for baixa (fora do escopo deste PR, anotar).

## 9. Sequência de commits sugerida (pequenos, em pt)

1. `chore: adiciona @supabase/ssr e NEXT_PUBLIC_SITE_URL`
2. `feat: clientes Supabase server/browser e middleware de sessão`
3. `feat: tela /entrar com magic link`
4. `feat: callback de auth troca code por sessao`
5. `feat: /painel stub protegido + link Entrar/Painel na navbar`
6. `test: callback de auth e fluxo de /entrar`
