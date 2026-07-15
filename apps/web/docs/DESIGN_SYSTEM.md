# AutoCore ERP — Design System Enterprise (Sprint 03)

> Identidade visual definitiva do produto. Nenhuma tela de negócio (Sprints
> 04+) deve criar cor, sombra, espaçamento, radius ou padrão de componente
> fora do que está documentado aqui. Quando um caso de uso novo aparecer,
> a resposta é **evoluir este Design System** (novo token/variante), nunca
> criar um valor "mágico" isolado dentro de uma tela de módulo.

Inspiração declarada: Apple (clareza, espaço negativo), Stripe (tipografia
numérica, densidade de dados confiável), Linear (velocidade percebida,
motion sutil), Framer (qualidade de animação), Notion (hierarquia tipográfica
calma), Vercel (dark mode com identidade própria, não inversão), Tesla
(minimalismo industrial), Canva (acessibilidade de cor, playfulness
controlado). Nenhum desses produtos é copiado — a combinação é única do
AutoCore ERP.

---

## 1. Design System completo — visão geral

Três camadas, cada uma só pode ser consumida pela camada acima:

```
tokens.css / design-tokens.ts   (cores cruas, espaçamento, radius, sombra,
                                  tipografia, motion, z-index, breakpoints)
        ↓
globals.css (tokens semânticos)  --background, --primary, --success...
tailwind.config.ts               expõe os tokens semânticos como classes
        ↓
components/ui/*.tsx               primitivos (Button, Input, Card, Select...)
components/motion/*.tsx           primitivos de animação (FadeIn, SlideIn...)
        ↓
components/common/*.tsx           padrões de produto (PageHeader, EmptyState...)
        ↓
módulos de negócio (Sprint 04+)   compõem os primitivos — nunca os recriam
```

Nenhuma camada pula a anterior: um módulo de negócio nunca escreve
`#F2730F` ou `rounded-[14px]` diretamente — sempre `bg-primary` ou
`rounded-lg`.

---

## 2. Tokens

Fonte de verdade: [`src/styles/tokens.css`](../src/styles/tokens.css) (CSS) e
[`src/config/design-tokens.ts`](../src/config/design-tokens.ts) (espelho TS,
para contextos que não leem `var()`, como séries do Recharts).

### Cor

8 escalas cruas (50–900), todas com 10 variações:

| Escala | Papel | Base (500) |
|---|---|---|
| `orange` | Laranja Premium — marca primária, CTAs | `#F2730F` |
| `petroleum` | Azul Petróleo — marca secundária, identidade da Sidebar | `#2C7782` |
| `graphite` | Neutro escuro — texto, dark mode | `#5C616B` |
| `gray` | Neutro claro — fundos, bordas | `#9AA1AD` |
| `green` | Sucesso | `#1FA866` |
| `yellow` | Alerta | `#EF9407` |
| `red` | Erro | `#E03E35` |
| `blue` | Informação | `#1F8FEF` |

Tokens **semânticos** (o que os componentes de fato usam) ficam em
`globals.css`, no formato `R G B` (sem `#`/`rgb()`), permitindo que o
Tailwind aplique opacidade (`bg-primary/10`) via `rgb(var(--primary) /
<alpha-value>)`. Ver `tailwind.config.ts` para o mapeamento completo:
`primary`, `secondary`, `success`, `warning`, `destructive`, `info`,
`muted`, `accent`, `card`, `popover`, `border`, `sidebar.*`.

### Tipografia

- **Display/Heading**: Lexend (títulos H1–H3, valores de KPI grandes) —
  geométrica, confiante, ótima legibilidade de números em destaque.
- **Corpo/UI**: Inter — o padrão de produtos como Stripe/Linear, excelente
  em tamanhos pequenos e com suporte nativo a `tabular-nums`.
- **Numérica**: a própria Inter, mas sempre com a classe utilitária
  `.font-numeric` (ou `.tabular-nums`), que ativa
  `font-feature-settings: 'tnum' 1` — todo valor monetário, quantidade ou
  KPI do ERP deve usar essa classe para alinhar dígitos em colunas de
  tabela/dashboard.

| Estilo | Tamanho | Peso | Uso |
|---|---|---|---|
| `text-h1` | 40px | 700 | Título de página única/hero |
| `text-h2` | 32px | 700 | Título de seção principal, valor de StatsCard |
| `text-h3` | 24px | 600 | Subtítulo de card, título de modal grande |
| `text-h4` | 20px | 600 | Título de Card padrão |
| `text-body` | 15px | 400 | Texto corrido, valor de input |
| `text-caption` | 13px | 400 | Legendas, texto auxiliar |
| `text-label` | 13px | 500 | Labels de formulário, headers de tabela |
| `text-button` (classe aplicada via `Button`) | 14px | 500 | Botões |

### Grid / Espaçamento

Escala oficial: **4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128** (px).
Coincide exatamente com a escala padrão do Tailwind (`1`→4px ... `32`→128px),
então o uso do dia a dia é direto (`p-4`, `gap-6`, `mt-12`). Os aliases
nomeados `grid-4`, `grid-8`... existem só para legibilidade em código de
layout complexo.

### Border Radius

`xs` 4px · `sm` 6px · `md` 10px · `lg` 14px (**padrão de cards/inputs**) ·
`xl` 20px · `2xl` 28px · `3xl` 36px · `full` (pill/avatar).

### Shadows

Extremamente suaves por design (baixa opacidade `0.04–0.14`, blur generoso,
sem espalhamento agressivo) — `xs`→`2xl`, mais `focus-ring` (anel de foco
laranja translúcido usado no lugar de outline padrão do navegador).

### Motion

Durações: `fast` 120ms (micro-interação, hover) · `base` 200ms (padrão:
abrir/fechar componente) · `slow` 320ms (entrada de conteúdo) · `page` 420ms
(transição de rota). Easing: `ease-out` `cubic-bezier(0.16,1,0.3,1)` para
quase tudo (sensação "premium" de desaceleração) e `ease-in-out` para
loops/toggles simétricos.

### Z-index

Escala única para acabar com "guerra de z-index": `dropdown` 1000 ·
`sticky` 1100 · `drawer` 1200 · `modal-overlay` 1300 · `modal` 1310 ·
`popover` 1400 · `toast` 1500 · `tooltip` 1600.

### Breakpoints

Padrão Tailwind, mobile-first: `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 ·
`2xl` 1536.

---

## 3. Biblioteca de componentes

Todos em `src/components/ui/` (primitivos) ou `src/components/motion/`
(animação), um arquivo por componente, sem barrel file (import direto:
`@/components/ui/button` — evita bundles inchados e import circular).

| Categoria | Componentes |
|---|---|
| **Botões** | `button.tsx` (Primary/Secondary/Outline/Ghost/Danger/Success/Warning/Link/Premium, 6 tamanhos, loading, disabled, pressed), `floating-action-button.tsx` (FAB), `split-button.tsx`, `dropdown-button.tsx` |
| **Inputs** | `input.tsx` (base, com ícones/loading/success/erro), `textarea.tsx`, `masked-inputs.tsx` (Search, Password, Money, Phone, CPF/CNPJ, CEP, NCM, CFOP, Date, Time, DateTime), `select.tsx`, `autocomplete.tsx` (Autocomplete + AsyncSelect), `tag-input.tsx`, `form-field.tsx` (wrapper de label/validação) |
| **Conteúdo** | `card.tsx`, `stats-card.tsx`, `badge.tsx`, `chip.tsx`, `avatar.tsx`, `separator.tsx`, `skeleton.tsx` |
| **Navegação** | `tabs.tsx`, `accordion.tsx`, `stepper.tsx`, `pagination.tsx` + `layouts/components/{Sidebar,Navbar,Breadcrumb}.tsx`, `footer.tsx` |
| **Overlays** | `dialog.tsx` (Modal), `drawer.tsx`, `popover.tsx`, `tooltip.tsx`, `dropdown-menu.tsx` |
| **Feedback** | `toast.tsx`, `alert.tsx`, `notification-item.tsx`, `components/common/{EmptyState,ErrorState,LoadingScreen,ErrorBoundary}.tsx` |
| **Dados** | `data-table.tsx` (Table básica), `advanced-data-table.tsx` (ordenação/filtro/colunas/seleção/export), `chart.tsx` (Line/Bar via Recharts), `calendar.tsx`, `timeline.tsx`, `kanban.tsx` |
| **Mídia** | `gallery.tsx`, `upload.tsx`, `qr-code.tsx`, `barcode.tsx` |
| **Motion** | `motion/{FadeIn,ScaleIn,SlideIn,PageTransition,StaggerList}.tsx` |

Total: **42 arquivos / 65 componentes exportados** nesta sprint, todos
tipados em TypeScript, sem `any` implícito (validado via `tsc --noEmit`) e
com build de produção (`vite build`) executado com sucesso.

---

## 4. Guia visual

- **Espaço é o luxo do produto**: preferir respiro generoso (`p-6`/`p-8`
  em cards e seções) a comprimir conteúdo. Cards grandes, não densos.
- **Cor com intenção**: laranja é reservado para ação primária/destaque —
  nunca decorativo. Petróleo aparece estruturalmente (Sidebar) para dar
  identidade sem competir com o laranja. O resto da interface é
  predominantemente neutro (gray/graphite) — "sem excesso de cores" é
  regra, não sugestão.
- **Sombra sugere, não grita**: usar `shadow-sm`/`shadow-md` no estado
  normal; reservar `shadow-lg`/`xl` para elementos realmente flutuantes
  (Drawer, Dialog, FAB, dropdown aberto).
- **Gradiente é point, não wallpaper**: `bg-gradient-primary` só em CTAs de
  destaque (FAB, botão `premium`, hero de upgrade de plano) — nunca em
  fundo de página ou card comum.
- **Números sempre tabulares**: qualquer preço, quantidade, KPI usa
  `font-numeric`.

---

## 5. Guia de UX

- **Feedback é imediato**: toda ação que demora (`isLoading` no Button/Input)
  mostra o próprio componente em estado de loading — nunca trava a tela sem
  explicação.
- **Erro nunca é silencioso**: toda falha de formulário usa `FormField`
  (mensagem inline) e toda falha de carregamento de dados usa `ErrorState`
  com ação de retry — o usuário nunca fica "preso" sem saber o que fazer.
- **Vazio é uma oportunidade, não um buraco**: toda lista vazia usa
  `EmptyState` com uma ação clara (ex: "Cadastrar primeiro produto").
- **Confirmação proporcional ao risco**: ações reversíveis (arquivar) não
  precisam de modal de confirmação; ações destrutivas/irreversíveis
  (excluir, cancelar venda) sempre passam por `Dialog`/`AlertDialog` com o
  botão usando `variant="destructive"`.
- **Toast é efêmero, Alert é persistente, Notification é histórico**: os
  três existem porque resolvem problemas diferentes — nunca usar um no
  lugar do outro (ex: nunca usar Toast para um aviso que o usuário precisa
  ver mesmo se sair da tela).
- **Motion tem função, não é decoração**: toda animação comunica algo
  (entrada de conteúdo, troca de rota, hierarquia em cascata) — nunca
  animação só "porque sim". `prefers-reduced-motion` é respeitado
  globalmente (ver `globals.css`).

---

## 6. Regras de consistência

1. Cor só via token semântico (`bg-primary`, `text-destructive`) — nunca
   `bg-orange-500` direto em tela de negócio (escalas cruas são para casos
   muito específicos dentro do próprio Design System, ex: ícone de
   StatsCard usando `bg-primary/10`).
2. Radius só via escala (`rounded-lg` como padrão de Card/Input/Button) —
   nunca `rounded-[12px]` arbitrário.
3. Toda nova variante de componente existente (ex: um 7º variant de Button)
   é adicionada ao arquivo do componente, nunca duplicada como um novo
   componente paralelo.
4. Todo componente que representa estado (erro/sucesso/loading) usa as
   props já padronizadas (`error`, `success`, `isLoading`) — nomes
   consistentes em toda a biblioteca, não `hasError` aqui e `isInvalid` lá.
5. Ícones são exclusivamente Lucide React, tamanho padrão `size-4` (16px)
   em contexto de texto/input e `size-5` (20px) em destaque — nunca
   misturar outra biblioteca de ícones.
6. Toda tela nova primeiro pergunta "qual componente do Design System já
   resolve isso?" antes de escrever HTML/CSS cru.

---

## 7. Estrutura dos componentes React

Padrão aplicado em 100% dos componentes desta sprint:

```tsx
// 1. Imports — sempre primitivos do Radix (quando aplicável) + cn + tokens
import * as React from 'react';
import { cn } from '@/utils/cn';

// 2. cva() para variantes, quando o componente tem variant/size
const xVariants = cva('classes-base', { variants: { ... } });

// 3. Interface de props — sempre estende o elemento HTML nativo
export interface XProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: ...;
}

// 4. forwardRef sempre que o componente envolve um elemento DOM focável/
//    mensurável (inputs, botões, triggers de overlay) — necessário para
//    Radix Slot, refs de formulário (React Hook Form) e testes.
const X = React.forwardRef<HTMLButtonElement, XProps>((props, ref) => { ... });
X.displayName = 'X';

// 5. Export nomeado (nunca default) — permite import consistente e
//    facilita code-splitting/tree-shaking.
export { X, xVariants };
```

Componentes Radix seguem o padrão "split" oficial do shadcn/ui (Root/
Trigger/Content/Item como exports separados), pois é o que melhor compõe
com a Acessibilidade (foco, ARIA) que o Radix já implementa — reimplementar
isso à mão seria regressão de qualidade.

---

## 8. Organização das pastas do Design System

```
src/
├── styles/
│   ├── tokens.css        # escalas cruas (cor, radius, shadow, motion, z-index)
│   └── globals.css       # tokens semânticos + base layer + dark mode
├── config/
│   └── design-tokens.ts  # espelho TS dos tokens (para Recharts/Framer Motion)
├── components/
│   ├── ui/                # primitivos puros — sem conhecimento de negócio
│   │   └── *.tsx           # um componente (ou família) por arquivo
│   ├── motion/             # primitivos de animação (Framer Motion)
│   │   └── *.tsx
│   └── common/             # padrões de PRODUTO (já com alguma opinião de UX,
│       └── *.tsx           # mas ainda sem conhecimento de domínio de negócio)
└── layouts/
    └── components/         # Sidebar/Navbar/Breadcrumb — específicos do shell
```

Regra de ouro de onde um componente novo nasce: **não sabe nada sobre
"venda" ou "produto" → `ui/`. Sabe que existe um conceito de "página" ou
"estado vazio" mas não qual módulo → `common/`. É específico de um módulo
de negócio (ex: `ProductCard`) → vive dentro de `modules/<modulo>/components/`,
nunca em `ui/` ou `common/`.**

---

## 9. Estratégia de reutilização

- **Composição sobre duplicação**: `AdvancedDataTable` é construído sobre
  `Pagination` + `SearchInput` + `DropdownMenu`, não reimplementa nada.
  `SplitButton`/`DropdownButton` reutilizam `Button`/`buttonVariants`.
  `MoneyInput`/`PhoneInput`/etc. reutilizam `Input`.
- **Tokens em uma única direção**: componente nunca define cor/espaçamento
  próprio — sempre herda de `tailwind.config.ts`. Trocar a cor primária do
  produto inteiro é uma alteração de 1 linha em `globals.css`.
- **Wrapper de validação único**: `FormField` é o único lugar que sabe
  renderizar erro/sucesso/hint — qualquer input novo (atual ou futuro) só
  precisa se preocupar com a própria interação, não com como exibir erro.
- **`design-tokens.ts` como ponte**: sempre que uma lib externa (Recharts,
  Framer Motion, QRCode) precisa de um valor de cor/duração em JS puro, ela
  consome daqui — nunca um valor duplicado manualmente.
- **Módulos de negócio nunca "forkam" um componente do Design System**: se
  um caso de uso não cabe na API atual, a evolução é no componente
  compartilhado (nova prop/variant), com o ganho propagando para todos os
  módulos automaticamente.

---

## 10. Checklist de qualidade visual

Antes de considerar qualquer tela de módulo de negócio (Sprint 04+) "pronta":

- [ ] Nenhuma cor hexadecimal/HSL/RGB hardcoded fora de `tokens.css`
- [ ] Nenhum `px` arbitrário de espaçamento fora da escala oficial (4·8·12·16·24·32·48·64·96·128)
- [ ] Todo Card/Input/Button usa `rounded-lg` (ou a variante de radius documentada) — nunca radius customizado
- [ ] Todo valor monetário/numérico usa `font-numeric`
- [ ] Todo estado de loading tem feedback visual (`isLoading` no componente, nunca tela "congelada")
- [ ] Toda lista vazia usa `EmptyState`; toda falha de carregamento usa `ErrorState`
- [ ] Toda ação destrutiva usa `variant="destructive"` e confirmação via `Dialog`
- [ ] Contraste de texto/fundo verificado em light **e** dark mode (não só assumido)
- [ ] Navegação por teclado funcional (Tab/Enter/Esc) em todo overlay (Dialog/Drawer/Popover/DropdownMenu já garantem isso via Radix — não interceptar esse comportamento manualmente)
- [ ] `prefers-reduced-motion` não foi contornado com animação forçada via JS
- [ ] Testado em viewport mobile (< 640px) antes de considerar a tela concluída — mobile-first, não "depois eu ajusto"
- [ ] `npx tsc --noEmit` e `npx eslint .` limpos antes de qualquer PR

---

## Acessibilidade (transversal a todo o Design System)

- **ARIA**: todo componente interativo não-nativo (Dropdown, Select,
  Accordion, Dialog, Tabs, Tooltip, Popover) é construído sobre Radix UI,
  que implementa as ARIA patterns corretas (roles, `aria-expanded`,
  `aria-controls` etc.) — não reimplementamos isso manualmente.
- **Contraste**: a paleta foi calibrada para atingir no mínimo AA (4.5:1)
  em texto normal sobre fundo (`--foreground` sobre `--background`,
  `--primary-foreground` sobre `--primary`) em ambos os temas; `warning`
  usa texto escuro (`--warning-foreground: graphite-900`) propositalmente,
  pois amarelo nunca atinge contraste AA com texto branco.
- **Teclado**: todo overlay fecha com `Esc`, todo menu navega com
  setas/Enter (padrão Radix), `Tab` nunca é interceptado/bloqueado em
  nenhum componente.
- **Foco visível**: `focus-visible:ring-2 focus-visible:ring-ring` é
  padrão em 100% dos componentes interativos — nunca `outline: none` sem
  substituto visível.
- **Screen reader**: textos de apoio para leitores de tela (`sr-only`,
  `aria-label`) em todo ícone usado como único conteúdo de um botão
  (fechar modal, remover chip, etc.).

## Mobile-first

Todo componente é desenhado primeiro para a viewport mobile (`< 640px`) e
depois estendido com `sm:`/`md:`/`lg:` — nunca o caminho inverso. A Sidebar
da Sprint 01 já segue este princípio (estado `collapsed`); módulos de
negócio devem usar `Drawer` (não `Dialog` centrado) como padrão de overlay
em mobile quando o conteúdo for um formulário longo, pois ocupa a tela de
forma mais natural em telas pequenas.
