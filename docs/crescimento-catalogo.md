# Estratégia — Crescer as visualizações do catálogo

> Frente 4 (parte de crescimento). Par do `docs/posicionamento-marca.md`.
> Objetivo do Leonardo: **mais gente vendo o catálogo**, de forma alinhada ao rebrand "A Rede".

## A tese em uma frase

O rebrand para **"A Rede"** não é cosmético: ele **destrava** o crescimento. Um nome preso a um
bairro limita busca, compartilhamento e expansão. "A Rede" amplia o público endereçável e dá um
guarda-chuva para crescer por bairro. Marca e crescimento são o mesmo movimento.

## O funil que estamos otimizando

```
Descoberta → Visita ao catálogo → Contato (WhatsApp) → Avaliação → Volta/Indica
```

"Visualizações do catálogo" é o 2º passo. Ele cresce por **dois motores**:

- **Aquisição** (gente nova chegando) — onde está a maior parte da oportunidade.
- **Densidade da oferta** (mais profissionais bons → mais motivos para visitar e voltar).

## 1. SEO local — o motor de maior alavancagem

A intenção de busca real não é "Parque dos Sinos"; é **"eletricista em Jacareí"**,
**"diarista perto de mim"**. O rebrand já alarga esse campo. Para capturar:

- **Perfil público por profissional** (`/profissional/[id]`, ver `docs/interface-profissional.md`):
  cada profissional vira uma página indexável. É a peça de SEO de maior impacto.
- **Páginas por categoria** indexáveis: `/catalogo?cat=...` hoje é client-side; criar rotas/links
  rastreáveis tipo "Eletricistas em Jacareí" dá entrada orgânica por serviço.
- **Metadados dinâmicos** por perfil/categoria (título + descrição com serviço + cidade).
- **`sitemap.xml` + `robots.txt`** listando perfis e categorias.
- **Dados estruturados** `LocalBusiness`/`Person` (schema.org) nos perfis → rich results.

> Hoje o catálogo é uma SPA client-side: o conteúdo não é facilmente indexável. Tornar perfis e
> categorias **server-rendered** é pré-requisito do SEO. Item técnico central desta frente.

## 2. Compartilhamento / viralidade (custo zero)

O profissional é o melhor distribuidor: ele **quer** divulgar o próprio perfil.

- **Link de perfil compartilhável** + botão "Compartilhar no WhatsApp".
- **Imagem de preview (OG image)** por perfil → link bonito no WhatsApp/Instagram puxa clique.
- "**Encontrei na Rede**" como bordão de compartilhamento.
- Pós-cadastro: "Pronto! Divulgue seu perfil:" com o link e botão de copiar/compartilhar.

## 3. Prova social — converte quem chega

- **Contadores na home**: "X profissionais · Y avaliações" (já foi prototipado na branch teal
  descartada; vale recuperar de forma simples).
- Selos **Recomendado** e **Verificado** dão credibilidade (ver `docs/autenticacao-e-selo.md`).
- **Comentários** das avaliações expostos no perfil (dado já coletado, hoje subutilizado).

## 4. Densidade e qualidade da oferta (retenção do lado profissional)

Catálogo bom = catálogo que vale a pena visitar de novo.

- **Foto no card** (PR já aberto) aumenta confiança e cliques.
- **Painel do profissional** (Frente 2/3) mantém cadastros atualizados → catálogo vivo.
- **Ordenação por avaliação** (PR já aberto) faz o bom profissional aparecer → recompensa qualidade.

## 5. Canais que a Rede já mapeou (Sobre)

A página Sobre já lista canais (WhatsApp, Instagram, murais, Facebook, lista de transmissão).
Transformar em rotina:

- **Grupo de WhatsApp** como motor de recirculação: "novos profissionais da semana" com link.
- **"Profissional da semana"** no Instagram apontando para o perfil público.
- **Murais físicos** com QR code → ponte do offline (vizinhança) para o catálogo.

## 6. Expansão por bairro (o porquê do rebrand)

Quando o Parque dos Sinos estiver denso:

- Abrir o **2º bairro** como capítulo da mesma marca ("A Rede — [bairro]").
- Filtro/seção por bairro no catálogo.
- Não diluir antes de provar densidade em 1 bairro (recomendação do doc de marca).

## 7. Medição — sem isso, é chute

Instrumentar o mínimo para saber o que funciona:

- Visualizações do catálogo e de cada perfil.
- Cliques em WhatsApp/Instagram (intenção de contato = valor entregue).
- Origem do tráfego (busca / compartilhamento / direto).
- Funil cadastro → avaliação.

> Ferramenta leve e gratuita (ex.: Vercel Analytics ou Plausible). Definir 1–2 métricas-norte:
> sugiro **visualizações de perfil** e **cliques de contato**.

## 8. Priorização sugerida (impacto × esforço)

| #   | Iniciativa                                       | Impacto | Esforço     |
| --- | ------------------------------------------------ | ------- | ----------- |
| 1   | Perfil público server-rendered + metadados       | Alto    | Médio       |
| 2   | Compartilhamento de perfil (WhatsApp + OG image) | Alto    | Baixo       |
| 3   | Prova social na home (contadores)                | Médio   | Baixo       |
| 4   | Sitemap + dados estruturados                     | Médio   | Baixo       |
| 5   | Páginas de categoria indexáveis                  | Médio   | Médio       |
| 6   | Analytics + métricas-norte                       | Médio   | Baixo       |
| 7   | Rotina de canais (WhatsApp/IG/murais)            | Médio   | Operacional |

**Sequência sugerida:** medição (6) primeiro, para ter linha de base; depois 2 e 3 (rápidos);
depois 1 e 4 (o grande motor de SEO); 5 e 7 em seguida.

## 9. Decisões tomadas (2026-06-17)

- [x] **Começar pelo perfil público + SEO** (item 1 da priorização) como maior alavanca.
- [x] **Analytics: Vercel Analytics** (já está na Vercel) — instrumentar visualizações de perfil e cliques de contato como métricas-norte.
- [x] **Recuperar os contadores** de prova social na home num PR simples.
- [x] **Registrar um domínio neutro** (alinhado ao `docs/posicionamento-marca.md`).
