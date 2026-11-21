# 🎨 LicitaDocs Frontend

> Interface SPA em React + TypeScript para o ecossistema **LicitaDocs**. Para visão geral do produto, arquitetura completa, Docker Compose e variáveis de ambiente, consulte o [README.md na raiz do repositório](../README.md).

---

## 🛠️ Stack de Interface
* **Core:** React 19 + Vite + TypeScript
* **Estilização & Ícones:** Tailwind CSS v4 + Lucide React
* **Roteamento & Formulários:** React Router DOM + React Hook Form + Zod
* **Integrações & Utilitários:** Axios, `@supabase/supabase-js`, `@react-pdf/renderer`, `docx`, `sonner`, `posthog-js`, `@sentry/react`
* **Testes:** Vitest + React Testing Library + `jsdom`

## 🏗️ Arquitetura (Orchestrator / Feature)
O frontend segue o padrão de separação de responsabilidades:
1. **`src/pages/`:** Roteadores e containers de layout (`Admin/`, `Client/` e páginas públicas).
2. **`src/features/`:** Módulos por domínio contendo Orquestradores (controle de estado), hooks e componentes de UI.
3. **`src/services/`:** Camada de comunicação HTTP com a API FastAPI via Axios.
4. **`src/types/`:** Fonte única da verdade para interfaces e tipos TypeScript (`index.ts`).

---

## 🚀 Comandos de Desenvolvimento

A partir da pasta `frontend/`:

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (http://localhost:5173)
npm run dev

# Executar suíte de testes (Vitest)
npm run test

# Executar testes com relatório de cobertura
npm run coverage

# Checagem de tipos TypeScript
npm run type-check

# Lint (ESLint)
npm run lint

# Build de produção
npm run build
```

---

## 📏 Convenções de UI e Código
* **Tipagem:** Evite `any`; utilize e centralize interfaces em `src/types/`.
* **Branding:** Renderize o nome da aplicação como string pura via `APP_CONFIG.name` (`src/config/app.config.ts`), sem estilização HTML/CSS segmentada.
* **Notificações (`sonner`):** A biblioteca não suporta `toast.warning()`; utilize `toast.error()` ou `toast()`.
* **Testes:** Mantenha arquivos `.spec.tsx` ou `.test.tsx` co-localizados com o componente/serviço testado.
