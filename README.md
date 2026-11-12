# Horizon (Web)

Interface Web Single Page Application (SPA) da plataforma **Horizon**, desenvolvida com **Angular 22** e arquitetura reativa moderna baseada em **Signals**, **Standalone Components** e alinhamento às diretrizes internacionais de acessibilidade digital **WCAG 2.1 (Nível AA)**.

Consulte o [Repositório Principal e Documentação Completa da API](https://github.com/tba-txt/Horizon-Travel) para a visão de ponta a ponta da arquitetura do sistema.

---

## 🚀 Começando

Estas instruções permitirão executar o frontend localmente em modo de desenvolvimento conectado à API do Horizon.

### 📋 Pré-requisitos

* **Node.js**: versão 22.x ou superior
* **npm**: gerenciador de dependências incluso no Node.js
* **Horizon API**: backend em execução (localmente em `http://localhost:8080` ou em nuvem no Render)

---

## 🔧 Instalação

```bash
# 1. Instalar as dependências do projeto
npm install

# 2. Iniciar o servidor de desenvolvimento
npm start
```

Acesse `http://localhost:4200` no seu navegador. O aplicativo será recarregado automaticamente se você alterar qualquer um dos arquivos de origem.

---

## ⚙️ Executando os testes

A suíte de testes unitários do frontend utiliza o test runner **Vitest**:

```bash
# Execução direta dos testes em modo single-run:
npm test -- --watch=false

# Ou através do script executável na raiz:
.\executar-testes.bat
```

Os testes cobrem:
* **Autenticação e Sessão:** Gestão de tokens JWT, persistência em storage e logout seguro;
* **Acessibilidade e Usabilidade:** Suporte a alto contraste, escalonamento responsivo de tipografia e controles com Web Speech API nativa;
* **Quiz e Feed Gamificado:** Lógica de navegação wizard e submissão de respostas com feedback CSAT/NPS integrado.

---

## 🛠️ Construído com

* [Angular 22](https://angular.dev/) - Framework SPA reativo
* [TypeScript 6](https://www.typescriptlang.org/) - Tipagem estática
* [Vitest](https://vitest.dev/) - Testes unitários de alta performance
* [Bootstrap 5](https://getbootstrap.com/) & [Motion](https://motion.dev/) - Sistema de grid responsivo e microinterações fluidas
* [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) - Acessibilidade assistiva integrada

---

## ✒️ Autores

* **Gabriel Santana** (*Gabriel Oliveira de Santana*) - [tba-txt](https://github.com/tba-txt)

---

## 📄 Licença

Este projeto está sob a licença **MIT** para fins acadêmicos e de portfólio.
