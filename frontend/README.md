# 🎨 LicitaDocs Frontend: Interface de Alta Performance

> Ecossistema de interface desenvolvido em React com TypeScript, focado em fornecer uma experiência fluida para a gestão de documentos licitatórios.

---

## 🛠️ Stack de Interface
- **Framework:** [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Linguagem:** TypeScript (Strict Mode)
- **Estilização:** Tailwind CSS
- **Validação de Formulários:** React Hook Form + Zod
- **Notificações:** Sonner
- **Testes:** Vitest + React Testing Library

## 🏗️ Arquitetura (Orchestrator/Feature)
O frontend segue um padrão de **Decentralização de Lógica**:
1. **Pages:** Atuam como roteadores e containers de layout.
2. **Orchestrators:** Localizados em `src/features/`, coordenam o estado e os hooks de cada funcionalidade.
3. **Services:** Abstrações de chamadas de API (`src/services/`) utilizando Axios.
4. **Hooks:** Extração de lógica reutilizável e complexa para Custom Hooks.

---

## 🚀 Guia de Desenvolvimento

### 1. Pré-requisitos
- Node.js (v18+)
- npm ou bun

### 2. Instalação de Dependências
Navegue até a pasta do frontend e instale os pacotes:
```bash
cd frontend
npm install
```

### 3. Execução em Desenvolvimento
Inicie o servidor de desenvolvimento do Vite:
```bash
npm run dev
```
A aplicação estará disponível por padrão em: `http://localhost:5173`

### 4. Testes e Verificação
Para rodar a suíte de testes unitários:
```bash
npm run test
```

Para realizar a checagem de tipos (TypeScript):
```bash
npm run typecheck
```

---

## 📏 Regras de Design e Refatoração
- **Single Source of Truth:** Todos os tipos devem residir em `src/types/index.ts`.
- **Branding:** O nome da aplicação deve ser renderizado como string vinda de `APP_CONFIG.name`.
- **Icons:** Utilize a biblioteca Lucide React para ícones padrão.
- **Testes:** Novos componentes devem vir acompanhados de arquivos `.spec.tsx`.

---
**Desenvolvido por Jules (AI Engineer) & Matheus Macieira.**