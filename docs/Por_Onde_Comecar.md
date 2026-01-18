# 🚀 Por Onde Começar (Guia de Transição)

**Projeto:** LicitaDoc (SaaS de Gestão de Documentos para Licitações)
**Versão Atual:** Sprint 05 (Frontend Foundation)
**Data:** 18/01/2026

---

## 🏗️ Estado do Projeto

O sistema opera em arquitetura **Monorepo** (Backend Python + Frontend React na mesma raiz).

### 🖥️ Frontend (Pasta `/frontend`)
* **Stack:** React, TypeScript, Vite, Tailwind CSS v4, Axios.
* **Status:**
    * Login funcionando e integrado.
    * Dashboard e Sidebar criados.
    * **Ponto de Atenção:** A tela de `Meus Documentos` estava apresentando erro de comunicação (Tela Branca/304). Foi configurado um **Proxy** no `vite.config.ts` para mitigar isso.
* **Comando de Start:** `npm run dev` (Roda na porta 5173, com proxy para 8000).

### ⚙️ Backend (Pasta `/app`)
* **Stack:** Python 3.12, FastAPI, SQLite, SQLAlchemy.
* **Status:** API funcional. Autenticação JWT, CRUD de Documentos e Integração IA (Gemini) prontos.
* **Comando de Start:** `uvicorn app.main:app --reload` (Porta 8000).
* **Swagger:** `http://localhost:8000/docs`

---

## 🎯 Objetivo Imediato (Sprint 05)

1.  **Verificar Fix do Proxy:** Ao iniciar o ambiente, testar se a listagem de documentos carrega. Se não, debugar o `vite.config.ts`.
2.  **Upload de Arquivos:** Implementar a funcionalidade do botão "Novo Documento" no Frontend.
3.  **Chatbot UI:** Construir a interface do chat com a IA.

---

## 🔑 Credenciais de Teste
* **Admin:** `admin@licitadoc.com` / `senha_super_secreta`