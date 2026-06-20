# Spec — Fluxo de Referral Hiperlocal

> PRD. **Prioridade #1 de Now** (`docs/roadmap.md`).
> Tese: A Rede torna o referral verbal ("você conhece um bom encanador?") persistente e clicável.
> Liga com: `docs/roadmap.md` (tese enablement→referral), `docs/crescimento-catalogo.md`.

## Problem Statement

Hoje a única forma de indicar um profissional via A Rede é copiar a URL do perfil manualmente.
Não há cópia pré-escrita, o preview de link é fraco, e o contato pelo WhatsApp não referencia a
Rede — então o profissional não sabe o que veio dela. Resultado: o referral hiperlocal que já
acontece no bairro (verbal, em grupos de WhatsApp) evapora sem deixar rastro e sem atribuição.

O gargalo não é o volume de tráfego: é que o canal de indicação natural da comunidade não está
capilarizado no produto.

## Protagonistas (dois atos de share, intenções distintas)

| Ato | Quem compartilha | Com quem | Intenção | Gatilho típico |
|-----|-----------------|----------|----------|---------------|
| **A — Pro → Audiência** | O profissional | Próprios contatos/redes | Autopromoção ("meu cartão digital") | Pro entra no painel |
| **B — Morador → Vizinho** | Cliente satisfeito | Rede pessoal no bairro | Indicação ("confio nesse profissional") | Após receber o serviço / após avaliar |

O **Ato B é o motor de aquisição**. O Ato A é suporte — se o pro já tem audiência, ele a converte
sozinho. O que A Rede entrega de único é a indicação de quem não é o próprio pro.

## Goals

1. **Compartilhar perfil em 1 toque** no perfil público (Ato B, prioridade) e no painel (Ato A).
2. **OG/preview de link impecável** — ao colar o link no WhatsApp, o preview mostra foto, nome,
   serviço e selo da Rede. É a infraestrutura que faz o referral *parecer confiável*.
3. **Clique-pra-WhatsApp pré-preenchido atribuível** — mensagem inclui contexto do serviço/item
   e referencia a Rede. Pro recebe lead identificado; o contato se torna mensurável.
4. **Gancho de indicação no fim da avaliação** — transforma o avaliador em divulgador no pico de
   satisfação, sem custo extra de distribuição.
5. **"Peça uma avaliação"** no painel — bootstrapa prova social usando os relacionamentos que o pro
   já tem, sem depender de tráfego da plataforma.

## Non-Goals

- **Orçamento estruturado (form):** Later. Hoje o clique-pra-WhatsApp pré-preenchido entrega
  "semi-estruturado" com zero fricção. O form entra quando houver volume de demanda a medir.
- **Notificações push/SMS ao morador indicado:** sem identidade do visitante, não aplicável agora.
- **Programa de incentivo monetário para indicações:** fora do escopo "gratuito e da comunidade".
- **Rastreio de quem foi indicado por quem** (grafo social completo): Later, quando o portão de
  pivô para marketplace estiver próximo.

## Fluxos detalhados

### 1. Compartilhar perfil (Ato B — página de perfil público)

**Onde:** botão proeminente na página `/profissional/[id]`, abaixo do header do perfil.

**Comportamento:**
- Mobile (90% do tráfego): usa a **Web Share API** (`navigator.share`) → abre o seletor nativo do
  sistema (WhatsApp, Instagram, cópia de link, etc.).
- Desktop / fallback: copia o link para o clipboard e exibe toast "Link copiado!".

**Cópia do texto de share (Ato B — morador indicando):**
```
Encontrei [Nome] na A Rede — [Serviço principal] aqui no Parque dos Sinos.
[URL do perfil]
```

**Variação por item/serviço específico** (share do item dentro do perfil):
```
Vi esse serviço na A Rede e achei que pode te interessar:
[Nome do item] — [Pro], [Serviço]
[URL do perfil]#item-[id]
```

**Label do botão:**
- Contexto de indicação: "Indicar para alguém" (prioridade visual — Ato B)
- Contexto de autopromoção (painel): "Compartilhar meu perfil" (Ato A)

---

### 2. OG image / preview de link (infraestrutura)

**Onde:** `app/profissional/[id]/opengraph-image.js` (já existe a rota OG; revisar o template).

**O que o preview precisa mostrar para converter:**
- Foto do profissional (ou placeholder com as iniciais se não houver).
- Nome completo + serviço principal.
- Bairro / "Parque dos Sinos".
- Selo "A Rede" (logo + nome) no canto inferior.
- Dimensões: `1200×630` px (padrão OG), com variante `600×600` para Instagram/WhatsApp.

**Critério de qualidade:** ao colar o link no WhatsApp (iOS e Android), o preview deve exibir foto
e nome sem precisar que o destinatário abra o link. Testar manualmente antes de marcar como pronto.

---

### 3. Clique-pra-WhatsApp pré-preenchido atribuível

**Onde:** botão "Chamar no WhatsApp" no perfil público — já existe; revisar a mensagem.

**Mensagem atual (inferida):** genérica ou sem contexto.

**Mensagem nova (com contexto e atribuição):**
```
Oi [Nome]! Vi seu perfil na A Rede e tenho interesse em [Serviço].
```

**Variação com item específico** (botão dentro do card do item):
```
Oi [Nome]! Vi na A Rede o seu serviço "[Nome do item]" e gostaria de saber mais.
```

**Por que isso importa operacionalmente:** o pro passa a distinguir contatos vindos da Rede de
outros canais. Isso fecha o loop de valor — ele *vê* o trilho funcionando. Sem atribuição, o pro
não sabe o que a Rede entregou e o engajamento com o painel não melhora.

**Nota de medição:** o clique nesse botão já deve estar registrado na tabela `eventos` (tipo
`contato_whatsapp`). Verificar se o payload inclui `profissional_id` e `origin` (URL de onde veio
o clique). Se não incluir, ajustar o evento antes do lançamento.

---

### 4. Gancho de indicação no fim da avaliação

**Onde:** página `/avaliar` — **após** o submit da avaliação, antes do redirect ou tela de
agradecimento.

**Fluxo:**
1. Usuário submete a avaliação.
2. Exibe tela de confirmação: "Obrigado! Sua avaliação foi registrada."
3. Logo abaixo, sem nova ação: "**Conhece alguém que precisaria desse profissional?**"
   → Botão "Indicar [Nome]" com o mesmo mecanismo de share (Web Share API / clipboard).
4. Se o usuário compartilha → evento `referral_share` registrado na tabela `eventos`.
5. Se não compartilha → skip silencioso; não bloquear o fluxo.

**Cópia do share pós-avaliação (Ato B no pico de satisfação):**
```
Acabei de avaliar [Nome] na A Rede — ótimo profissional de [Serviço] no Parque dos Sinos!
[URL do perfil]
```

**Princípio:** o gancho é *suave* — apresenta a opção, não exige. Quem avaliou 4-5 estrelas está
no pico de advocacia; a apresentação do share nesse momento aumenta conversão sem custo.

---

### 5. "Peça uma avaliação" no painel do profissional

**Onde:** `/painel`, módulo de avaliações (nova pílula ou seção dentro da pílula existente).

**Comportamento:**
- Pro clica em "Pedir avaliação".
- Gera um link curto (ou a URL direta do perfil com `?acao=avaliar`) para ser copiado/compartilhado.
- Pro cola no WhatsApp para clientes anteriores: "Você poderia avaliar meu trabalho aqui?"

**Cópia de apoio (para o pro enviar ao cliente):**
```
Olá! Fico feliz em ter te ajudado. Poderia deixar uma avaliação do meu trabalho na A Rede?
É rápido e me ajuda muito. 🙏
[link de avaliação]
```
*(O pro adapta livremente — é sugestão, não obrigatório.)*

**Por que não colocar o pedido de avaliação no botão de WhatsApp de contato:**
Sem identidade do visitante, não há como fechar o loop (saber que o contato virou cliente). O
mecanismo painel-driven é o mais simples e o que o pro controla diretamente.

---

## Métricas de sucesso (eventos na tabela `eventos`)

| Evento | O que mede |
|--------|-----------|
| `share_perfil` | Ato de compartilhar o perfil (Ato A ou B) |
| `share_item` | Compartilhamento de item específico |
| `share_pos_avaliacao` | Indicação gerada no gancho pós-avaliação |
| `contato_whatsapp` | Clique no botão de WhatsApp (já existe — verificar payload) |
| `avaliacao_solicitada` | Pro usou "peça uma avaliação" no painel |

**Métrica-norte do `/admin`:** profissionais com `share_perfil` ≥ 1 no mês + `contato_whatsapp`
total gerado via Rede no mês. Esse par mede se o trilho de referral está ativo.

## Sequência de implementação sugerida

| Ordem | Item | Esforço estimado |
|-------|------|-----------------|
| 1 | Revisar OG image (foto + nome + serviço + selo) e testar preview no WhatsApp | S |
| 2 | Revisar mensagem do clique-pra-WhatsApp (adicionar contexto + "Vi na A Rede") | XS |
| 3 | Botão "Indicar para alguém" no perfil público (Web Share API + fallback clipboard) | S |
| 4 | Verificar/ajustar payload do evento `contato_whatsapp` (origin + profissional_id) | XS |
| 5 | Gancho de indicação pós-avaliação (após submit, antes do redirect) | S |
| 6 | "Peça uma avaliação" no painel (link copiável + cópia de apoio) | S |
| 7 | Share por item/serviço específico | S–M |
| 8 | Registrar evento `share_*` e expor no `/admin` | S |

> **Validar antes da ordem 3:** testar o ato de compartilhamento na mão com 1–2 profissionais e
> clientes reais antes de polir o fluxo. A suposição mais arriscada do modelo é que o morador vai
> compartilhar espontaneamente.

## Decisões em aberto

- [ ] O link de avaliação em "peça uma avaliação" é a URL do perfil com `?acao=avaliar` (simples,
      sem backend) ou um link curto rastreável? — Recomendação: `?acao=avaliar` agora; link curto
      quando houver volume para medir.
- [ ] O botão "Indicar para alguém" aparece sempre ou só para perfis com foto/avaliação? —
      Recomendação: sempre (sem foto também precisa de indicação).
- [ ] Cópia do share (texto) é fixa ou editável pelo usuário? — Recomendação: pré-preenchida e não
      editável no app (a Web Share API deixa o usuário editar no seletor nativo de qualquer forma).
