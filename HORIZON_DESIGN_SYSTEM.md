# Horizon Design System & UX Standards (Anti-Slop Framework)

> **Design Read:** Plataforma premium de turismo consciente e curadoria editorial inteligente para viajantes e avaliadores acadêmicos. Linguagem visual refinada, elegante e funcional, com física fluida (Motion) e conformidade estrita com a regra 60-30-10.

---

## 1. Princípios Fundamentais (Anti-Slop Discipline)

1. **Anti-Default Discipline:**
   - Sem gradientes roxos genéricos de IA ou fundos escuros de malha sem sentido.
   - Sem cards repetitivos com a mesma cara e proporção.
   - Tipografia intencional com forte contraste hierárquico.
   - Respiro e espaçamento estruturado (espaço em branco como elemento ativo de design).

2. **The Three Dials (Calibração do Horizon):**
   - **`DESIGN_VARIANCE: 7`** (Equilíbrio entre simetria corporativa e toques editoriais de revista moderna).
   - **`MOTION_INTENSITY: 6`** (Animações táteis de física elástica/spring, sem loops infinitos que cansem a vista).
   - **`VISUAL_DENSITY: 4`** (Leitura arejada e confortável, estilo *The New York Times Travel* / *Monocle*).

---

## 2. Paleta de Cores Oficial (Regra 60-30-10)

| Função | Cor | Hex | Uso |
|---|---|---|---|
| **60% Base Neutra** | Branco Puro / Off-White | `#FFFFFF` / `#F8FAFC` | Superfícies, cards, áreas de leitura |
| **60% Bordas & Divisórias** | Slate 200 | `#E2E8F0` | Linhas finas, separadores e contornos |
| **30% Azul Marinho (Identidade)** | Deep Navy | `#0B2545` | Hero, Navbar, cabeçalhos de autoridade, rodapé |
| **30% Azul Céu (Interação)** | Sky Horizon | `#4895CC` | Botões primários, links, tabs ativas, pills comuns |
| **10% Verde Sustentável (Destaque)** | Eco Green | `#63B921` | Selo de ecoturismo, preços, pills ecológicas |
| **10% Rosa / Ação (Conversão)** | Horizon Coral | `#FF4D85` / `#FF5C8D` | CTA principal de conversão ("Reservar", "Quiz") |

---

## 3. Tipografia & Hierarquia Editorial

- **Headings (H1, H2, H3):**
  - Sans-serif sólida, geométrica (`font-weight: 700` ou `800`).
  - Cor: `#0B2545` (títulos principais) ou `#1E293B`.
  - Letter-spacing sutilmente negativo (`-0.02em`) em tamanhos grandes para densidade editorial.
- **Body & Artigos:**
  - Cor de leitura: `#334155` ou `#475569` (nunca cinza-claro de baixo contraste).
  - Entrelinha: `line-height: 1.65` no corpo geral e `1.8` no modal de leitura profunda.
- **Metadados (Data, Tempo de Leitura, Tags):**
  - Cor: `#64748B`, ícones pequenos (`bi bi-clock`, `bi bi-calendar3`).

---

## 4. Componentes Padronizados

### A. Pills de Filtro e Categoria
```html
<button class="btn btn-sm rounded-pill px-3 py-2 fw-semibold category-pill"
        [class.active-pill]="isActive && !isEco"
        [class.active-pill-eco]="isActive && isEco">
  {{ label }}
</button>
```
- **Normal:** Fundo `#F8FAFC`, borda `#E2E8F0`, texto `#475569`.
- **Hover:** Elevação `transform: translateY(-2px)`, fundo `#E2E8F0`.
- **Active Comum:** Fundo `#4895CC`, texto branco, sombra `0 4px 14px rgba(72, 149, 204, 0.4)`.
- **Active Ecoturismo:** Fundo `#63B921`, texto branco, sombra `0 4px 14px rgba(99, 185, 33, 0.4)`.

### B. Cards de Conteúdo
- Cantos arredondados: `border-radius: 1rem` (`rounded-4`).
- Borda fina: `1px solid #E2E8F0`.
- Hover: Elevação suave `transform: translateY(-4px)`, sombra `0 12px 28px rgba(11, 37, 69, 0.08)`.
- Aspect Ratio de imagens: Imagens consistentes com `object-fit: cover`.

### C. Modais de Experiência
- Backdrop: Escurecimento azul marinho translúcido `rgba(11, 37, 69, 0.65)` com `backdrop-filter: blur(8px)`.
- Dialog: `rounded-4`, sombra difusa de alta profundidade.
- Entrada via Motion: Escala elástica `scale: [0.93, 1]`, `y: [24, 0]`, `duration: 0.35s`.
- Saída via Motion: `scale: [1, 0.95]`, `y: [0, 16]`, `opacity: [1, 0]`, `duration: 0.18s`.

---

## 5. Diretrizes Motion (Core JS/TS)

Sempre importar da biblioteca oficial:
```typescript
import { animate, stagger } from 'motion';
```

- **Stagger em Listas e Grids:**
  ```typescript
  animate('.post-card', { opacity: [0, 1], y: [24, 0] }, { 
    delay: stagger(0.05), 
    duration: 0.4, 
    ease: 'easeOut' 
  });
  ```
  *(Atenção: a propriedade de transição no Motion é `ease`, nunca `easing`)*.

- **Modais:**
  ```typescript
  animate(dialog, { opacity: [0, 1], scale: [0.93, 1], y: [24, 0] }, { 
    duration: 0.35, 
    ease: [0.16, 1, 0.3, 1] 
  });
  ```

---

## 6. Roteiro de Aplicação Tela a Tela

1. **[x] Feed Editorial (`/feed`):**
   - Concluído como modelo de referência com carrossel de imagens, cards unificados, fundo slate suave, zero hashtags visíveis e sem tempo de leitura.
2. **[ ] Checkout / Pagamento (`/checkout`):**
   - Transição suave entre etapas (Passageiros → Pagamento → Confirmação).
   - Virada 3D fluida do cartão virtual ao digitar dados.
   - Bilhetes de embarque (Boarding Passes) revelados com animação de desdobramento.
3. **[ ] Área do Usuário (`/profile`):**
   - Transições de abas, destaques de viagens e modais padronizados.
4. **[ ] Destinos (`/destinations`):**
   - Animação de entrada dos cards ao scrollar (`inView`), modal de clima padronizado.
5. **[ ] Voos (`/flights`):**
   - Seleção de assentos, filtros de companhias e horários.
6. **[ ] Quiz (`/quiz`):**
   - Transições cinematográficas entre perguntas e tela de resultado.

---

## 7. Diretrizes Específicas do Usuário (Regras Intocáveis)

1. **Cabeçalhos Limpos:**
   - Títulos diretos (ex: apenas `Feed`), sem excesso de badges decorativas ("Diário de bordo", "Revista") e sem subtítulos genéricos.
2. **Carrossel de Imagens nos Posts:**
   - Todo card deve permitir navegação de imagens em carrossel (`‹` e `›` com glassmorphism e indicadores de dots), suportando múltiplos registros.
3. **Metadados Ocultos do Usuário (Algoritmo Silencioso):**
   - **NÃO** exibir hashtags como `#GASTRONOMIA`, `#CULTURA`, `#URBANO` nos cards. Esses atributos existem unicamente para alimentar a inteligência artificial e o motor de recomendação interno do usuário.
4. **Desacoplamento de Post vs. Destino de Voo:**
   - **NÃO** incluir botão "Ver Destino" nos posts. Artigos do feed são crônicas amplas de interesse (natureza, praias, gastronomia, etc.) e não pacotes diretos de voo.
5. **Sem "Tempo de Leitura":**
   - Remover badges como "2 min de leitura". Apenas exibir data de publicação quando disponível.
6. **Consistência Total nos Cards:**
   - Sem cards discrepantes (onde um tem botão outline e outro filled, ou um com texto e outro sem). Todos os cards do feed compartilham exatamente o mesmo padrão de botões:
     - `👍 Gostei (X)`
     - `👎 Não Gostei (X)`
     - `Ler Artigo` (botão primário)
7. **Eliminação do "Tudo Branco" (Page Framing):**
   - Fundo do container/página em tom suave (`#F6F8FB`), fazendo os cards brancos (`#FFFFFF`) contrastarem com profundidade, bordas finas e sombras elegantes.
8. **Otimização Extrema de Imagens:**
   - Compressão automática para WebP (`&w=720&q=75&fm=webp`), garantindo que o feed carregue em milissegundos sem travamentos.
9. **Layout 3 Colunas Widescreen (Zero Margens Vazias / Anti-Tudo-Branco):**
   - Em telas widescreen (>= 1200px / 1600px), a tela aproveita o espaço nobre com 3 colunas inteligentes:
     - **Coluna Esquerda:** **Radar de IA** (barras com percentuais calculados dinamicamente com base nas curtidas do usuário, revelando a inteligência neural ativa) e **Estilos de Viagem / Vibes** (atalhos visuais que filtram o feed com 1 clique).
     - **Coluna Central:** O stream editorial do feed, com carrossel responsivo e cards padronizados.
     - **Coluna Direita:** CTAs de conversão (Quiz interativo com perfil de viajante, Clima em tempo real nas paradas tendência, turismo regenerativo, dicas do viajante e busca de voos).
10. **Carrossel Drag & Swipe Tátil Nativo:**
    - Suporte completo a **arraste com mouse no desktop** (`mousedown`, `mousemove`, `mouseup`) com auto-snap suave ao slide mais próximo.
    - Suporte nativo a **gestos de deslize touch no mobile/tablet** via `scroll-snap-type: x mandatory`.
11. **Controles de Carrossel de Alto Contraste:**
    - Botões com diâmetro de **44px**, fundo **branco sólido (`#FFFFFF`)**, ícone azul marinho (`#0B2545`), sombra de elevação profunda (`box-shadow: 0 4px 16px rgba(11, 37, 69, 0.22)`) e efeito zoom suave no hover (`scale(1.12)`).
    - Badge translúcida no canto superior direito indicando a foto atual (ex: `1 / 3`), garantindo ao usuário a certeza de que há mais imagens na crônica.
12. **Micro-interações Motion Táteis:**
    - Botões de Like (`👍`) e Dislike (`👎`) disparam efeito elástico de física (*spring pop*: `scale: [1, 1.25, 0.94, 1]`).
    - Botão de Favorito / Salvar (`🔖`) com efeito pop elástico e rotação sutil (`rotate: [0, -12, 12, 0]`).
    - Entradas de lista com *stagger cascade* suave de `0.05s`.


