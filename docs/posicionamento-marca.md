# Posicionamento de Marca — "A Rede"

> Documento de estratégia. Acompanha o PR de rebrand `melhoria/rebrand-a-rede`.
> Decisão tomada com o Leonardo em 2026-06-16: **rebrand para "A Rede" como marca-mãe**,
> com o bairro de origem (Parque dos Sinos) rebaixado a contexto.

## 1. Problema

A marca atual amarra o produto a um único bairro:

- Nome de produto na prática = "Rede de Profissionais do Parque dos Sinos".
- Navbar, hero, rodapé e metadados repetem "Parque dos Sinos / Jacareí".

Isso cria dois limites:

1. **Teto de crescimento.** Um morador de outro bairro de Jacareí sente que o serviço
   "não é pra ele". O nome exclui antes mesmo de explicar o valor.
2. **SEO e compartilhamento estreitos.** A página compete só pelo termo de um bairro,
   quando a intenção de busca real é `"eletricista jacareí"`, `"diarista perto de mim"`.

O objetivo do Leonardo — **aumentar visualizações do catálogo** — exige um nome que
caiba em mais buscas e mais bairros sem perder a alma comunitária.

## 2. Decisão

**"A Rede"** vira a marca-mãe. O Parque dos Sinos passa a ser a _história de origem_,
não a fronteira.

| Antes                                       | Depois                                       |
| ------------------------------------------- | -------------------------------------------- |
| "Rede de Profissionais do Parque dos Sinos" | **A Rede de Profissionais**                  |
| Hero: "do Parque dos Sinos" (H1)            | Hero: "A Rede" (H1) + origem como legenda    |
| Navbar logo "PS" / "Parque dos Sinos"       | "AR" / "A Rede"                              |
| Rodapé fixado no bairro                     | "Nascida no Parque dos Sinos · Jacareí – SP" |

### Princípio de redação

- **Marca** = "A Rede" (curto, memorável, expansível).
- **Origem** = "nascida no Parque dos Sinos" — aparece como prova de raiz comunitária,
  sempre como legenda/contexto, nunca como nome.
- **Cobertura** = "Jacareí" — o território que queremos ocupar nas buscas.

## 3. Por que isso ajuda o crescimento (e não só estética)

1. **Amplia o público endereçável** de um bairro para a cidade, sem trair a origem.
2. **Casa com a tese de expansão por bairro**: a arquitetura de marca já comporta
   "A Rede — Parque dos Sinos", "A Rede — Cidade Salvador" etc. como _capítulos_,
   não como produtos diferentes.
3. **Mantém a confiança local**: a origem comunitária é o nosso diferencial contra
   GetNinjas/Thumbtack. Não jogamos isso fora — viramos legenda.

> Ver `docs/crescimento-catalogo.md` para as alavancas de aquisição que dependem
> deste posicionamento (SEO local, compartilhamento, prova social).

## 4. Implementação técnica

Todas as strings de marca foram centralizadas em [`app/brand.js`](../app/brand.js):

```js
BRAND = { nome, nomeCompleto, sigla, origem, cidade, origemLonga, tagline };
```

Benefício: a próxima evolução de marca (ou a entrada de um novo bairro) é uma edição
em **um arquivo**, não uma caçada por texto em cada página.

## 5. Decisões em aberto (para o Leonardo)

- [ ] **Domínio/URL**: vale registrar um domínio neutro (ex.: `arede...`) em vez de algo
      preso ao bairro? (afeta SEO e percepção)
- [ ] **Logo**: a sigla "AR" é placeholder. Vale um símbolo (ponto/rede) no lugar das letras?
- [ ] **Quando** anunciar a expansão para outros bairros — antes ou depois de saturar o
      Parque dos Sinos? (recomendação: provar densidade em 1 bairro antes de abrir o 2º)
