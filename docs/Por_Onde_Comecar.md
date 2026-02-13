# 🤖 CONTEXTO DO PROJETO: LICITADOC (v1.0.4)

**ATENÇÃO AGENTE AI:** Este arquivo contém o estado atual, regras de arquitetura e instruções de setup do projeto. Leia-o antes de gerar qualquer código.

---

## 1. Definição do Sistema
**Produto:** LicitaDoc - SaaS Multi-Tenant para Gestão de Documentos de Licitação.
**Fase Atual:** Pós-Sprint 15 (Arquitetura Multi-Tenant implementada). Iniciando Sprint 16 (Refatoração & UX).
**Arquitetura:** Monolito Modular (Backend) + SPA (Frontend).

---

## 2. Stack Tecnológica (Strict Mode)

### Backend (Pasta `/app`)
* **Framework:** FastAPI (Python 3.10+).
* **ORM:** SQLAlchemy (Sync sessions).
* **Migrations:** Alembic (**CRÍTICO:** O esquema do banco é gerenciado via versionamento).
* **Auth:** OAuth2 com JWT. Suporte a Multi-Tenancy via `UserCompanyLink`.
* **Uploads:** `multipart/form-data` salvos localmente em `/data` (simulando S3).

### Frontend (Pasta `/frontend`)
* **Build:** Vite + React (TypeScript).
* **Estilo:** TailwindCSS + Shadcn/UI (Componentes em `src/components/ui`).
* **State:** Context API (`AuthContext` gerencia Token + Empresa Atual).
* **Data Fetching:** Axios (Instância configurada em `services/api.ts`).

---

## 3. Estado Atual da Arquitetura (Sprint 15+)

### 🏢 Multi-Tenancy (Mudança Recente)
O sistema não é mais "1 User = 1 Company".
* **Tabela N:N:** `user_company_links` vincula usuários a empresas com roles (`MASTER`, `VIEWER`).
* **Contexto:** O Backend espera `company_id` em rotas de dados (Dashboard, Docs).
* **Middleware:** Não há middleware mágico. O filtro é explícito nos Repositories (`.filter(company_id=...)`).

### 📂 Documentos
* **Metadados:** A tabela `documents` possui `title`, `filename`, `expiration_date` e `company_id`.
* **Download:** Endpoint protegido que verifica se o usuário tem link com a `company_id` do documento.

### 🚦 Rotas e Permissões
* `/admin/*`: Rotas de Superusuário (Vê tudo).
* `/companies/{id}/*`: Rotas de Tenant (Requer vínculo com a empresa).
* `/auth/register`: Fluxo híbrido (JSON + Arquivos) usando `FormData`.

---

## 4. Instruções de Setup para a IA (Como rodar)

Se você (IA) precisar instruir o usuário ou gerar scripts de correção, assuma este fluxo:

1.  **Backend:**
    * O ambiente virtual é `venv`.
    * **OBRIGATÓRIO:** Rodar `alembic upgrade head` antes de iniciar. O banco `licita_doc.db` costuma ficar defasado entre sessões.
    * Comando de start: `uvicorn app.main:app --reload`.

2.  **Frontend:**
    * O `.env` deve apontar `VITE_API_URL=http://localhost:8000`.
    * Comando de start: `npm run dev`.

---

## 5. Regras de Desenvolvimento (Do's & Don'ts)

* **NÃO** assuma que o usuário tem o campo `company_id` direto na tabela `users`. Use `user.company_links`.
* **NÃO** crie estilos CSS soltos. Use classes utilitárias do Tailwind.
* **SEMPRE** que alterar um Model (SQLAlchemy), gere uma revisão do Alembic (`alembic revision --autogenerate`).
* **SEMPRE** mantenha a compatibilidade com o `AuthContext.tsx` atual (ele carrega empresas no login).

---

## 6. Backlog Imediato (Sprint 16)
O foco agora é **estabilidade**. Não sugira novas features de IA/OCR ainda.
1.  Tratar erros 401/403 no Frontend (Interceptor).
2.  Melhorar UX de Loading e Feedback.
3.  Padronizar Tabelas e Modais.