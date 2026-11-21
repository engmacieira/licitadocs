# 🤖 LicitaDocs

> Plataforma SaaS B2B/Concierge para gestão documental, habilitação licitatória, automação de certidões, consultoria com Inteligência Artificial e prospecção ativa via PNCP para o mercado público brasileiro.

---

## 📍 Visão Geral e Proposta de Valor

O **LicitaDocs** centraliza e automatiza a conformidade documental de empresas que participam de licitações públicas no Brasil. Evoluindo de um **Cofre Digital (Vault)** para um ecossistema completo de operação e inteligência comercial, a plataforma resolve três dores centrais:

1. **Conformidade Contínua (Cliente):** Organização centralizada de certidões e documentos societários, monitoramento de validades, exportação de kit completo em `.zip` e geração de declarações personalizadas (`.doc` e `.pdf`).
2. **Operação Concierge & Automação (Backoffice):** Gestão multi-tenant de empresas clientes, fila de solicitações e diretórios de emissão (Nacional, Estadual e Municipal), além de motor de crawlers para captura automatizada de certidões.
3. **Inteligência Aplicada & Prospecção (IA + PNCP):** Assistente virtual com RAG (*Retrieval-Augmented Generation*) focado no cofre da empresa e módulo administrativo de captação e abordagem de leads do **Portal Nacional de Contratações Públicas (PNCP)** com controle anti-SPAM.

---

## 🛠️ Arquitetura e Stack Tecnológica

O projeto segue uma arquitetura desacoplada entre API RESTful (Backend) e SPA (Frontend), com **PostgreSQL obrigatório em todos os ambientes** (desenvolvimento, testes e produção).

### Backend (`app/`)
* **Linguagem & Framework:** Python 3.11+, FastAPI (`0.128.0`), Uvicorn e AnyIO.
* **Padrão Arquitetural:** MVC / Repository (`routers/` → `services/` → `repositories/` → `models/` + `schemas/`).
* **Banco de Dados & Migrações:** PostgreSQL 15+, SQLAlchemy (`2.0.45`) com *connection pool* configurado e *Soft Delete* (`SoftDeleteMixin`), Alembic (`1.18.3`) e integração com Supabase (`supabase`, `postgrest`, `storage3`).
* **Segurança & Middlewares:**
  * Autenticação JWT (`python-jose`, `PyJWT`, `bcrypt`/`passlib`) e RBAC (`admin` / `client`) com Multi-Tenancy (`MASTER` / `VIEWER`).
  * Rate Limiting global/por rota (`slowapi`).
  * Limite de tamanho de payload em uploads (`PayloadSizeLimitMiddleware` com máximo de 20 MB).
  * Trilha de auditoria sistêmica (`AuditMiddleware`) e rastreamento por `X-Request-ID` (`asgi-correlation-id`).
  * Documentação Swagger/ReDoc ocultada automaticamente quando `ENV=production`.
* **Automação & Crawlers:** Motor baseado em *Strategy Pattern* (`CrawlerFactory` e `BaseCrawler`) com `httpx` e `playwright` para emissão/consulta (`CartaoCNPJCrawler`, `FGTSCrawlerV1`, `TSTCrawlerV1`) e orquestração em `OrchestratorService` (APScheduler desativado/comentado no `main.py` atual; robôs externos temporariamente pausados conforme [ROADMAP_VISAO_FUTURA.md](docs/guia-e-roadmap/ROADMAP_VISAO_FUTURA.md)).
* **Inteligência Artificial:** SDK oficial do Google Gemini (`google-genai`, modelo `gemini-2.0-flash`) em `AIClient` + `AIService`, utilizando RAG sobre os documentos unificados do tenant e controle de cota diária (`DAILY_TOKEN_LIMIT = 30000`) via `AIQuotaRepository`.
* **Observabilidade & Mensageria:** Sentry (`sentry-sdk`), `structlog`, envio de e-mails transacionais (`EmailService` via SMTP) e integração assíncrona com a API pública do PNCP (`PncpService`).

### Frontend (`frontend/`)
* **Core:** React 19 (`19.2.0`), TypeScript (`~5.9.3`), Vite (`7.2.4`).
* **Estilização & UI:** Tailwind CSS v4 (`@tailwindcss/vite`), Lucide React (`lucide-react`), Sonner (`sonner` para notificações).
* **Formulários, Roteamento & Dados:** React Router DOM (`^7.12.0`) com *lazy loading* de páginas, React Hook Form + Zod (`zod`), Axios (`axios`), `@supabase/supabase-js`.
* **Geração de Documentos & Analytics:** `@react-pdf/renderer`, `docx`, `file-saver`, `dompurify`, `posthog-js`, `@sentry/react`.
* **Padrão Arquitetural:** Orchestrator/Feature (`src/pages/` → `src/features/` → `src/services/` + `src/hooks/` + `src/types/`).
* **Testes:** Vitest (`^4.0.18`), React Testing Library e `jsdom`.

### Infraestrutura & CI/CD
* **Containers:** `Dockerfile` (Python `3.11-slim` + Uvicorn) e `frontend/Dockerfile` (*multi-stage build* Node 22 Alpine → Nginx Alpine com [frontend/nginx.conf](frontend/nginx.conf) configurado para fallback SPA `try_files`).
* **Orquestração Local & Staging:** `docker-compose.yml` (PostgreSQL 15 local), `docker-compose.test.yml` (PostgreSQL 15 em `tmpfs` para testes rápidos) e `docker-compose.staging.yaml` (backend local + imagem frontend no GHCR).
* **Pipeline CI:** GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) executando testes em paralelo (*matrix sharding*: 4 shards para `pytest` no backend com serviço `postgres:15` e 3 shards para `vitest` no frontend) em pushes de branches de trabalho e PRs para `main` e `develop`.

---

## 🧩 Principais Módulos e Funcionalidades

### 1. Área do Cliente & Multi-Tenancy
* **Onboarding & Autenticação:** Cadastro completo, login, OAuth (Google/Azure via configuração), recuperação de senha, recuperação de e-mail por documento, verificação de e-mail, assinatura digital de contrato/procuração (`/contract-sign`, `/signature`) e checkout/pagamento (`/payment`).
* **Dashboard & Governança:** Funil de onboarding, gestão da empresa e equipe (`/company-settings`) com papéis corporativos (`MASTER` / `VIEWER`).
* **Modelos de Declarações (`/document-templates`):** Geração de documentos e declarações personalizadas com dados e logo da empresa, com exportação em `.doc` e `.pdf`.
* **Central de Ajuda (`/help-center`):** Comunicação direta com a equipe operacional via sistema de mensagens/tickets.

### 2. Cofre Digital & Emissão Automatizada
* **Gestão de Documentos (`/documents`):** Upload seguro, listagem unificada por categoria, visualização/download protegido contra IDOR/BOLA, versionamento e *Soft Delete*.
* **Exportação em Lote:** Geração em streaming de arquivo `.zip` (`stream-zip`) com os documentos válidos da empresa.
* **Diretórios & Fila de Emissão (`/emission-rules`):** Cadastro de regras e links de emissão por abrangência (Nacional, Estadual, Municipal) e fila de solicitações para emissão manual ou assistida.
* **Motor de Crawlers (`app/services/crawlers/`):** Estratégias modulares implementadas para Cartão CNPJ, FGTS e CNDT/TST.

### 3. Consultor IA (AI Concierge)
* **Chat Contextualizado (`ai_router.py`):** Responde dúvidas sobre a situação documental e de habilitação da empresa consultando em tempo real o status dos documentos no cofre (RAG).
* **Proteção contra Abuso:** Bloqueio automático ao atingir o limite diário de tokens por empresa (`AIQuotaRepository`).

### 4. Backoffice Administrativo (`/admin/*`)
* **Gestão Global:** Dashboard administrativo (`/admin/dashboard`), lista e detalhes de empresas (`/admin/companies`, `/admin/companies/:id`) com moderação de status e avisos.
* **Operação Documental:** Upload administrativo para clientes (`/admin/upload`), monitor de validades (`/admin/validity-monitor`), gestão de regras de emissão (`/admin/emission-rules`), emissão manual (`/admin/manual-emission/:ruleId`) e catálogo de tipos/categorias (`/admin/settings`).
* **Inbox Bilateral (`/admin/inbox`):** Central de atendimento para tickets e alertas entre clientes e administradores.

### 5. Prospecção PNCP & Controle Anti-SPAM (`/admin/leads`)
* **Captura & Sincronização (`pncp_lead_router.py` + `PncpService`):** Consulta assíncrona à API pública do PNCP por UF, modalidade e janela retroativa de dias, realizando *upsert* seguro de fornecedores (`PncpLead`).
* **CRM & Anti-SPAM:** Filtragem por texto, UF e status de elegibilidade (`all`, `ready`, `cooldown`, `never_contacted`), registro de contatos e janela de *cooldown* configurável (`cooldown_days`, padrão de 7 dias) para evitar abordagens repetitivas.

### 6. Auditoria & Segurança
* **Trilha de Auditoria (`/admin/audit-logs`):** Registro sistêmico via `AuditMiddleware` e `AuditLog` de ações críticas de negócio e requisições.
* **Integridade:** Validação matemática de CPF/CNPJ no backend e frontend, além de cabeçalhos de correlação (`X-Request-ID`).

---

## 📦 Estrutura do Projeto

```text
licitadocs/
├── .github/workflows/
│   └── ci.yml                      # Pipeline CI (Pytest em 4 shards + Vitest em 3 shards)
├── alembic/                        # Scripts e versões de migração do banco (Alembic)
├── app/                            # Backend FastAPI
│   ├── core/                       # Config (pydantic-settings), Database, AI Client, Rate Limit, Segurança
│   ├── middlewares/                # AuditMiddleware (trilha de auditoria sistêmica)
│   ├── models/                     # Entidades SQLAlchemy (Company, User, Document, Certificate, PncpLead, etc.)
│   ├── repositories/               # Camada de acesso a dados (BaseRepository e repositórios de domínio)
│   ├── routers/                    # Endpoints REST (auth, user, company, document, dashboard, message, emission_rule, ai, admin, pncp_lead)
│   ├── schemas/                    # Contratos Pydantic (validação e serialização)
│   ├── scripts/                    # Utilitários operacionais internos
│   ├── services/                   # Regras de negócio (AI, Email, Orchestrator, PNCP) e crawlers/
│   ├── templates/                  # Templates de documentos/e-mails
│   ├── tests/                      # Suíte de testes Pytest (unitários, integração e stress)
│   ├── utils/                      # Helpers (arquivos, validações, etc.)
│   ├── dependencies.py             # Injeção de dependências, auth JWT e RBAC
│   └── main.py                     # Entrypoint FastAPI, middlewares e registro de routers
├── docs/                           # Documentação de negócio, guias, histórico e minutas
│   ├── arquitetura-e-regras/       # Regras de código, user stories, domínio e segurança IA
│   ├── guia-e-roadmap/             # Guias de entrada, dívidas técnicas e roadmap
│   ├── historico/                  # Sprints finalizados, kanban e release notes (até v2.0.4)
│   ├── juridico/                   # Documentos jurídicos (Contrato, Procuração, Termo)
│   └── minutas/                    # Minutas e avisos operacionais
├── frontend/                       # Frontend React + TypeScript + Vite
│   ├── src/
│   │   ├── components/             # Componentes compartilhados e layouts (MainLayout, PublicLayout, ProtectedRoute)
│   │   ├── config/                 # Configurações da aplicação (app.config.ts)
│   │   ├── contexts/               # Contextos React (AuthContext)
│   │   ├── features/               # Módulos por domínio (Orchestrators, hooks e UI específica)
│   │   ├── hooks/                  # Hooks globais reutilizáveis
│   │   ├── lib/                    # Configurações de bibliotecas externas
│   │   ├── pages/                  # Páginas públicas, Client/ e Admin/
│   │   ├── schemas/                # Schemas Zod de validação
│   │   ├── services/               # Clientes HTTP (Axios) por domínio
│   │   ├── test/                   # Setup de testes Vitest
│   │   ├── types/                  # Interfaces e tipos centralizados (Single Source of Truth)
│   │   ├── utils/                  # Utilitários de formatação e validação
│   │   └── App.tsx                 # Roteamento principal e lazy loading
│   ├── Dockerfile                  # Build multi-stage (Node 22 + Nginx Alpine)
│   ├── nginx.conf                  # Configuração SPA e cache de estáticos
│   ├── package.json                # Scripts e dependências do frontend
│   └── README.md                   # Guia complementar específico do frontend
├── infra/                          # Configurações auxiliares de infraestrutura
├── scripts/                        # Scripts de seed (reset_and_seed.py, seed_document_types.py)
├── .env.example                    # Modelo de variáveis de ambiente
├── AGENTS.md                       # Diretrizes arquiteturais e operacionais para agentes
├── alembic.ini                     # Configuração do Alembic
├── docker-compose.yml              # Banco PostgreSQL 15 local (porta 5433)
├── docker-compose.test.yml         # Banco PostgreSQL 15 em tmpfs para testes (porta 5435)
├── docker-compose.staging.yaml     # Stack de staging (Backend + Frontend Nginx)
├── Dockerfile                      # Imagem Docker do Backend FastAPI
├── pytest.ini                      # Configuração do Pytest
└── requirements.txt                # Dependências Python do Backend
```

---

## ⚙️ Setup Local, Variáveis de Ambiente e Testes

### 1. Pré-requisitos
* **Python:** `3.11+`
* **Node.js:** `20+` (e `npm`)
* **Docker & Docker Compose** (ou instância PostgreSQL 15+ acessível)

### 2. Variáveis de Ambiente (`.env`)
Crie um arquivo `.env` na raiz do repositório baseado em [.env.example](.env.example). As variáveis mapeadas no projeto são:

| Categoria | Variáveis |
| :--- | :--- |
| **Ambiente & Infra** | `ENV` (`development`, `staging`, `production`), `FRONTEND_URL`, `CORS_ORIGINS`, `STORAGE_PATH` |
| **Banco de Dados & Supabase** | `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_JWT_SECRET`, `SENHA_PROJETO_SUPABASE`, `BANCO_AWS`, `SENHA_AWS` |
| **Segurança & JWT** | `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `RESET_TOKEN_EXPIRE_MINUTES` |
| **OAuth** | `GOOGLE_ID_do_cliente`, `GOOGLE_Chave_secreta_do_cliente`, `AZURE_ID_do_aplicativo`, `AZURE_Chave_secreta_do_client` |
| **IA & Integrações** | `GOOGLE_API_KEY`, `SENTRY_DSN`, `GITHUB`, `TELEGRAM_TOKEN`, `TELEGRAM_CHAT_ID` |
| **E-mail (SMTP)** | `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAILS_FROM_EMAIL`, `EMAILS_FROM_NAME`, `ADMIN_EMAIL_NOTIFICATIONS` |
| **WhatsApp & Pagamentos** | `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN`, `INFINITEPAY_API_KEY`, `INFINITEPAY_WEBHOOK_SECRET` |

> No **Frontend**, o build/CI utiliza `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e a flag opcional `VITE_COMING_SOON_MODE`.

### 3. Executando Localmente (Backend + Banco + Frontend)

#### A. Banco de Dados (Docker Compose)
Sobe o PostgreSQL 15 na porta `5433` (conforme [docker-compose.yml](docker-compose.yml)):
```bash
docker compose up -d
```
Exemplo de `DATABASE_URL` para o banco local acima:
```text
postgresql://licita_user:licita_pass@localhost:5433/licitadocs
```

#### B. Backend (FastAPI)
```bash
# Criar e ativar ambiente virtual (opcional, recomendado)
python -m venv .venv

# Instalar dependências
pip install -r requirements.txt

# Aplicar migrações do banco de dados
alembic upgrade head

# Iniciar servidor de desenvolvimento
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
*Health check:* `http://localhost:8000/` (Swagger em `/docs` quando `ENV != production`).

#### C. Frontend (React + Vite)
Consulte também o guia complementar em [frontend/README.md](frontend/README.md):
```bash
cd frontend
npm install
npm run dev
```
A interface estará disponível em `http://localhost:5173`.

#### D. Stack via Docker Compose (Staging)
Para subir Backend + Frontend empacotado com Nginx utilizando [docker-compose.staging.yaml](docker-compose.staging.yaml):
```bash
docker compose -f docker-compose.staging.yaml up -d --build
```

### 4. Executando Testes e Verificações

#### Backend (`pytest`)
O projeto utiliza um banco PostgreSQL 15 dedicado em memória (`tmpfs`) na porta `5435` definido em [docker-compose.test.yml](docker-compose.test.yml):
```bash
# 1. Subir o banco de testes
docker compose -f docker-compose.test.yml up -d

# 2. Garantir DATABASE_URL apontando para postgresql://postgres:postgres@localhost:5435/licitadocs_test
# 3. Aplicar migrações no banco de testes
alembic upgrade head

# 4. Rodar a suíte completa de testes
python -m pytest
```
> No CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)), a execução é distribuída com `pytest-split` (`python -m pytest --splits 4 --group <1..4>`).

#### Frontend (`vitest` e checks)
A partir do diretório `frontend/`:
```bash
# Testes unitários e de componentes
npm run test

# Cobertura de testes
npm run coverage

# Checagem de tipos TypeScript
npm run type-check

# Lint (ESLint)
npm run lint

# Build de produção
npm run build
```

---

## 🤝 Fluxo de Contribuição e Governança

1. **Diretrizes Obrigatórias:** Leia [AGENTS.md](AGENTS.md) e [docs/arquitetura-e-regras/00REGRAS_CODIGO.md](docs/arquitetura-e-regras/00REGRAS_CODIGO.md) antes de propor alterações. O projeto segue o protocolo *Zero Guessing* e proíbe o uso de SQLite.
2. **Rastreabilidade (Linear):** As tarefas são gerenciadas no projeto **LicitaDocs** (equipe `LIC`). Referencie a issue correspondente nos commits seguindo o padrão Conventional Commits (ex: `feat(core): LIC-12 reestrutura módulo de contratos`).
3. **Branches e Pull Requests:** O pipeline de CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) é disparado automaticamente em pushes de branches de trabalho e em Pull Requests direcionados para `main` ou `develop`.
4. **Grafo de Arquitetura (Graphify):** Após alterações estruturais no código, atualize o grafo de conhecimento local executando `python -m graphify update .`.
5. **Documentação de Produto:** Consulte [docs/arquitetura-e-regras/DOMINIO_NEGOCIO.md](docs/arquitetura-e-regras/DOMINIO_NEGOCIO.md), [docs/guia-e-roadmap/ROADMAP_VISAO_FUTURA.md](docs/guia-e-roadmap/ROADMAP_VISAO_FUTURA.md), as notas de versão em [docs/historico/releases/](docs/historico/releases/v2.0.4.md) e as sprints em [docs/historico/sprints/SPRINT_31_PNCP_LEADS.md](docs/historico/sprints/SPRINT_31_PNCP_LEADS.md).

---
**LicitaDocs** — Repositório privado.
