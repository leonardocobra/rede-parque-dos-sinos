# Brainstorm — Interface do Profissional

> Documento de produto. Frente 3.
> Pergunta do Leonardo: _"vale a pena ter essa seção? o que verão? quais funcionalidades e
> problemas vamos resolver?"_

## TL;DR

Existem **duas interfaces** diferentes escondidas na palavra "interface do profissional".
Vale a pena ter as duas, em ordem:

1. **Perfil público do profissional** (`/profissional/[id]`) — uma página por profissional.
   **Sim, vale muito** e deveria vir primeiro: ajuda direto o objetivo de _crescer visualizações
   do catálogo_ (cada profissional vira uma página indexável e compartilhável).
2. **Painel privado do profissional** (`/painel`) — área logada para gerir o próprio cadastro.
   Vale a pena, mas **depende da autenticação** (Frente 2) e resolve um problema mais interno.

Hoje o profissional "mora" dentro de um card expansível no catálogo. Isso tem teto.

## 1. O problema atual

O profissional não tem **lugar próprio** no produto:

- Não há URL para mandar a um cliente ("olha meu perfil na Rede").
- O card mostra pouco e não é compartilhável nem indexável pelo Google.
- Depois de cadastrar, o profissional **perde o controle** — não edita, não atualiza foto, não
  responde a uma avaliação.

São dois problemas distintos: **exposição** (público) e **gestão** (privado).

## 2. Interface A — Perfil público `/profissional/[id]`

### Vale a pena?

**Sim, e é a de maior alavancagem para o objetivo de crescimento.** Cada perfil é:

- uma **landing page indexável** ("eletricista no Parque dos Sinos" → cai no perfil do João);
- um **link compartilhável** no WhatsApp/Instagram (o próprio profissional divulga → traz tráfego
  novo pra Rede de graça);
- espaço para **mais prova social** do que cabe num card.

### O que o visitante vê

- Cabeçalho: foto, nome, serviço, categoria, selos (**Recomendado** / **Verificado**).
- Nota média + distribuição das avaliações + os 3 percentuais (pontual / contrataria / conforme).
- Descrição, experiência, regiões atendidas, bairro.
- **Comentários das avaliações** (hoje coletados mas pouco exibidos).
- CTAs: WhatsApp, Instagram, "Avaliar este profissional".
- Bloco "outros profissionais de [categoria]" → mantém o visitante navegando no catálogo.

### Problemas que resolve

- Exposição e SEO local (alavanca direta de `docs/crescimento-catalogo.md`).
- Dá ao profissional algo concreto para divulgar → aquisição viral barata.
- Aproveita dado já coletado (comentários) que hoje fica subutilizado.

### Esforço

**Baixo/médio.** Os dados já existem; é uma nova rota que reusa `computeStats`. Não depende de auth.
Bom candidato a PR isolado logo após os atuais.

## 3. Interface B — Painel privado `/painel`

### Vale a pena?

Sim, mas **depende da Frente 2 (login)**. É o que transforma um cadastro estático num perfil vivo.

### O que o profissional logado vê

- Seus cadastros (normalmente 1).
- **Editar**: serviço, descrição, foto, contato, regiões — corrige o que hoje fica preso.
- Status dos selos: "Você é Recomendado ✓" / "Verificação: pendente — fale com a Rede".
- Métricas simples e motivadoras: nº de visualizações do perfil, nº de avaliações, nota média.
- (Fase 2+) **Responder a uma avaliação** — direito de resposta gera confiança e engajamento.

### Problemas que resolve

- Cadastro desatualizado / com erro (telefone errado = cliente perdido).
- Falta de senso de propriedade → profissional engajado mantém o catálogo vivo e volta ao site.
- Loop de retenção do lado da **oferta** (o profissional tem motivo para voltar).

### Esforço

**Médio/alto** — exige auth, RLS de dono e telas de edição. Vai junto da fase 2 da Frente 2.

## 4. O que NÃO fazer agora (anti-escopo)

- Chat interno / mensagens na plataforma → o WhatsApp já resolve; manter o contato direto.
- Agenda/orçamento/pagamento dentro do app → vira outro produto; fora da tese comunitária.
- Planos pagos / destaque pago → cedo demais; mata a percepção de "gratuito e da comunidade".

## 5. Recomendação de sequência

1. **Perfil público `/profissional/[id]`** — maior alavanca de crescimento, sem depender de auth.
2. **Auth (Frente 2, fase 2)** — destrava o painel.
3. **Painel `/painel`** — edição + métricas + (depois) resposta a avaliações.

> Liga com: `docs/crescimento-catalogo.md` (perfil público = peça de SEO/compartilhamento) e
> `docs/autenticacao-e-selo.md` (painel exige o login leve).

## 6. Decisões em aberto (para o Leonardo)

- [ ] Topo da fila: **perfil público** primeiro (recomendado) ou painel?
- [ ] Exibir **comentários** das avaliações no perfil público desde já? (aumenta confiança, mas exige moderação leve)
- [ ] Mostrar **contagem de visualizações** ao profissional — vale instrumentar isso já no perfil público?
