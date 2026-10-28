# Horizon Web — Guia de Estilo & Design System de Autenticação

Este documento estabelece o **padrão visual e arquitetural oficial** para todas as telas de autenticação do Horizon Web (Login, Cadastro/Registro, Recuperação de Senha e Redefinição de Senha).

---

## 1. Visão Geral da Arquitetura Visual

Todas as telas de autenticação utilizam o componente estrutural `<app-auth-layout>`, que divide a tela em duas metades com proporção fluida:

- **Lado da Imagem (Branding Side):** 
  - Fundo em degradê profundo Horizon com imagem temática (`object-fit: cover`).
  - Proporção: `flex: 1.25` em desktops, oculta no mobile (`d-none d-md-block`).
  - Imagem do Login: `assets/login.webp` (lado esquerdo).
  - Imagem do Cadastro: `assets/cadastro.webp` (lado direito).
- **Lado do Formulário (Form Side):**
  - Fundo cinza suave (`#f4f6f9`) com textura de **ruído estático denso** (`fractalNoise` monocromático).
  - Proporção: `flex: 1`.

---

## 2. Paleta de Cores Oficial

| Papel | Cor Hex | CSS / RGBA | Uso |
|---|---|---|---|
| **Azul Primário Horizon** | `#4A90E2` | `rgb(74, 144, 226)` | Títulos, links de destaque, bordas ativas e ícones |
| **Azul Escuro Horizon** | `#2b6cb0` | `rgb(43, 108, 176)` | Fim do degradê de botões, estados de hover |
| **Azul Marinho Profundo** | `#0b2545` | `rgb(11, 37, 69)` | Sombras de profundidade e contraste |
| **Fundo Externo** | `#4A90E2` | `rgb(74, 144, 226)` | Moldura externa da janela de autenticação |
| **Fundo da Coluna Form** | `#f4f6f9` | `rgb(244, 246, 249)` | Base cinza clara texturizada com ruído |
| **Texto Principal** | `#1e293b` | `rgb(30, 41, 59)` | Títulos e textos de campos |
| **Texto Secundário / Labels** | `#475569` | `rgb(71, 85, 105)` | Rótulos de formulário (`fw-bold`) |

---

## 3. Especificações dos Componentes

### 3.1. Card de Vidro Fosco (`.glass-card`)

O contêiner do formulário flutua sobre o fundo utilizando a técnica de **Glassmorphism**:

```css
.glass-card {
  max-width: 440px; /* 520px para cadastros com colunas duplas */
  background: linear-gradient(
    135deg, 
    rgba(255, 255, 255, 0.28) 0%, 
    rgba(255, 255, 255, 0.08) 100%
  );
  backdrop-filter: blur(36px) saturate(210%) contrast(106%);
  -webkit-backdrop-filter: blur(36px) saturate(210%) contrast(106%);
  border: 1.5px solid rgba(255, 255, 255, 0.65);
  border-radius: clamp(20px, 3vw, 28px);
  box-shadow: 
    0 30px 60px -12px rgba(11, 37, 69, 0.15),
    0 12px 28px -6px rgba(74, 144, 226, 0.08),
    inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.95),
    inset 0 -1.5px 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

/* Reflexo de luz ambiente no topo do vidro (Specular Sheen) */
.glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.28) 0%,
    rgba(255, 255, 255, 0.04) 40%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 0;
}
```

---

### 3.2. Selo / Badge do Topo (`.brand-badge`)

Ícone circular de 52x52px com o pin de viagem do Horizon:

```css
.brand-badge {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #4A90E2 0%, #2b6cb0 100%);
  box-shadow: 0 8px 18px rgba(74, 144, 226, 0.35);
  border-radius: 50%;
}
```

---

### 3.3. Inputs com Sombreamento e Alto Contraste (`.form-control-glass`)

Campos de entrada com fundo translúcido aveludado (`0.72`), ícone SVG à esquerda e sombra de relevo:

```css
.custom-glass-input-group {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.input-icon {
  position: absolute;
  left: 15px;
  color: #4A90E2;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 2;
}

.form-control-glass {
  width: 100%;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1.5px solid rgba(74, 144, 226, 0.32);
  border-radius: 14px;
  padding: 0.75rem 1rem 0.75rem 2.85rem;
  font-size: 0.95rem;
  color: #1e293b;
  box-shadow: 
    0 4px 16px -2px rgba(11, 37, 69, 0.08),
    0 2px 6px 0 rgba(74, 144, 226, 0.04),
    inset 0 1.5px 2px rgba(255, 255, 255, 0.9);
  transition: all 0.25s ease;
  outline: none;
  position: relative;
  z-index: 1;
}

.form-control-glass:focus {
  background: #ffffff;
  border-color: #4A90E2;
  box-shadow: 
    0 8px 24px -4px rgba(74, 144, 226, 0.25),
    0 0 0 4px rgba(74, 144, 226, 0.18),
    inset 0 1px 2px rgba(255, 255, 255, 0.9);
}
```

---

### 3.4. Botão de Revelar Senha (`.btn-toggle-eye`)

Botão posicionado absolutamente à direita dos campos de senha:

```css
.btn-toggle-eye {
  position: absolute;
  right: 14px;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  transition: color 0.2s ease, transform 0.15s ease;
  z-index: 2;
}

.btn-toggle-eye:hover {
  color: #4A90E2;
  transform: scale(1.1);
}
```

---

### 3.5. Botão de Ação Principal (`.btn-horizon-action`)

Botão com degradê azul, cantos arredondados de 14px e elevação interativa:

```css
.btn-horizon-action {
  background: linear-gradient(135deg, #4A90E2 0%, #2b6cb0 100%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 14px;
  color: white;
  font-size: 1rem;
  letter-spacing: 0.3px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-horizon-action:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(74, 144, 226, 0.35);
  background: linear-gradient(135deg, #357ABD 0%, #1d5088 100%);
  color: white;
}

.btn-horizon-action:disabled {
  opacity: 0.55;
  color: white;
  cursor: not-allowed;
}
```

---

## 4. Animações de Entrada (Motion)

Todas as telas de autenticação utilizam a biblioteca `motion` com entrada em cascata suave (`stagger`):

```typescript
ngAfterViewInit(): void {
  setTimeout(() => {
    const items = document.querySelectorAll('.register-anim-item'); // ou .login-anim-item
    if (items.length > 0) {
      animate(
        items,
        { opacity: [0, 1], y: [14, 0] },
        { delay: stagger(0.05), duration: 0.4, ease: 'easeOut' }
      );
    }
  }, 40);
}
```

---

## 5. Responsividade Padrão

- **Telas Grandes (>= 1200px):** Formatos de 2 colunas lado a lado preservando proporções confortáveis.
- **Tablets e Laptops:** O card se ajusta dinamicamente através de regras `clamp()` de padding e border-radius.
- **Celulares (< 768px):** A coluna de imagem se oculta automaticamente via Bootstrap (`d-none d-md-block`) e o container de formulário ocupa a tela com cantos arredondados de 20px, garantindo facilidade de uso em dispositivos móveis.
