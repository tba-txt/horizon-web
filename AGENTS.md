# Horizon Web - AI Agents Guidelines

> [!CAUTION]
> ## REGRA ABSOLUTA E INEGOCIÁVEL (NUNCA VIOLE)
> **NUNCA EXECUTAR NENHUM COMANDO DE COMPILAÇÃO, BUILD OU TESTE (NEM MVN, NG BUILD, NPM RUN BUILD, NG TEST, NPM TEST, OU QUALQUER OUTRO). NUNCA!**
> - **O agente deve estritamente APENAS alterar/escrever o código.**
> - **ZERO compilações, ZERO testes, ZERO builds.**
> - O usuário cuida da execução, build e testes no terminal dele.

---

## Regras Estritas do Projeto Horizon

### 1. Comandos de terminal
- **PROIBIDO rodar `ng build`, `npm run build`, `ng test`, `npm test`, `mvn` ou qualquer comando de compilação/teste.**
- Se precisar verificar arquivos, use ferramentas de leitura de arquivos ou buscas pontuais. Se não achar de primeira, pergunte ao usuário imediatamente sem gastar tokens procurando à toa.

### 2. Cores Padrão Horizon (Estrito)
- **Azul Horizon:** `#5BA4D8`
- **Verde Horizon:** `#65A30D`

### 3. Diretrizes de Design (Estrito)
- **NUNCA usar formato pill / badges tipo cápsula (`rounded-pill`).** O usuário odeia design com pill.
- **NUNCA usar linhas divisórias horizontais** (`border-top`, `border-bottom`, dividers, `<hr>`).
- **NUNCA usar setas** (`→`, `bi-arrow-right`, ícones de seta em botões como "prosseguir para reserva", etc.).

### 4. Diretrizes de Branding (Estrito)
- **NÃO existe "Horizon Travel".** A marca e o nome são estritamente **Horizon**.
- As classes de voo são estritamente: **Básico**, **Executivo** e **Premium** (nunca "Horizon Comfort", "Economy", etc.).

