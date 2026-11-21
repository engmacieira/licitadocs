---
name: qa-ci-infra-ops
description: Guia operacional para QA (Pytest, Vitest, Playwright E2E), pipeline CI/CD no GitHub Actions, containers Docker/Nginx e governança de repositório no LicitaDocs. Acione ao alterar testes, fixtures, workflows, Dockerfiles, compose ou regras de operação do agente.
---

# QA, CI/CD, Infraestrutura & Governança Operacional

## Quando Acionar (Gatilhos)
- Criação ou manutenção de testes backend (`pytest`), unitários frontend (`vitest`) ou E2E (`playwright`).
- Alterações em `.github/workflows/ci.yml`, `Dockerfile`, `frontend/Dockerfile`, `frontend/nginx.conf` ou `docker-compose*.yml`/`yaml`.
- Diagnóstico de falhas de banco de testes, mocks globais (`conftest.py`, `setup.ts`), sharding no CI ou conflito entre Vitest e Playwright.
- Dúvidas sobre governança (`AGENTS.md`, `.agents/rules/graphify.md`) e artefatos legados/residuais na raiz ou em `jules/` e `infra/tinybird/`.

## Fonte de Verdade no Código
- **CI/CD:** [.github/workflows/ci.yml](file:///e:/Projetos%20VSCODE/licitadocs/.github/workflows/ci.yml) (único workflow ativo em `.github/workflows/`).
- **Docker & Nginx:**
  - [Dockerfile](file:///e:/Projetos%20VSCODE/licitadocs/Dockerfile) (backend FastAPI)
  - [frontend/Dockerfile](file:///e:/Projetos%20VSCODE/licitadocs/frontend/Dockerfile) e [frontend/nginx.conf](file:///e:/Projetos%20VSCODE/licitadocs/frontend/nginx.conf)
  - [docker-compose.yml](file:///e:/Projetos%20VSCODE/licitadocs/docker-compose.yml), [docker-compose.test.yml](file:///e:/Projetos%20VSCODE/licitadocs/docker-compose.test.yml), [docker-compose.staging.yaml](file:///e:/Projetos%20VSCODE/licitadocs/docker-compose.staging.yaml)
- **Testes Backend:** [pytest.ini](file:///e:/Projetos%20VSCODE/licitadocs/pytest.ini), [app/tests/conftest.py](file:///e:/Projetos%20VSCODE/licitadocs/app/tests/conftest.py).
- **Testes Frontend & E2E:**
  - [frontend/package.json](file:///e:/Projetos%20VSCODE/licitadocs/frontend/package.json), [frontend/vite.config.ts](file:///e:/Projetos%20VSCODE/licitadocs/frontend/vite.config.ts), [frontend/src/test/setup.ts](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/test/setup.ts)
  - [frontend/playwright.config.ts](file:///e:/Projetos%20VSCODE/licitadocs/frontend/playwright.config.ts), [frontend/e2e/auth-and-upload.spec.ts](file:///e:/Projetos%20VSCODE/licitadocs/frontend/e2e/auth-and-upload.spec.ts)
- **Governança:** [AGENTS.md](file:///e:/Projetos%20VSCODE/licitadocs/AGENTS.md), [.agents/rules/graphify.md](file:///e:/Projetos%20VSCODE/licitadocs/.agents/rules/graphify.md).
- **Legados / Inativos:** [jules/instrucoes_jules.md](file:///e:/Projetos%20VSCODE/licitadocs/jules/instrucoes_jules.md), [infra/tinybird/README.md](file:///e:/Projetos%20VSCODE/licitadocs/infra/tinybird/README.md).

## Arquitetura, Regras e Padrões Ativos

### 1. Pipeline CI/CD (`.github/workflows/ci.yml`)
- **Gatilhos:** `push` com `branches-ignore: [main, develop]` e `pull_request` para `[main, develop]`, ambos filtrados por `paths: ['app/**', 'frontend/**', '.github/workflows/ci.yml']`.
- **Job `backend-tests` (`ubuntu-latest`):**
  - Python `3.11`, serviço `postgres:15` na porta `5435:5432` (`licitadocs_test`, `--tmpfs /var/lib/postgresql/data`).
  - Variáveis: `ENV="test"`, `DATABASE_URL="postgresql://postgres:postgres@localhost:5435/licitadocs_test"`, além de `SUPABASE_URL`, `SUPABASE_KEY` e `GOOGLE_API_KEY` via `secrets`.
  - Instala `requirements.txt` + `pytest pytest-split pytest-asyncio`, roda `alembic upgrade head` e executa `python -m pytest --splits 4 --group <1..4>` (`fail-fast: false`).
- **Job `frontend-tests` (`ubuntu-latest`):**
  - Node `20`, `npm ci` em `frontend/` e `npx vitest run --shard=<1..3>/3` (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` via `secrets`).
  - Playwright E2E ainda não possui job dedicado no `ci.yml`.

### 2. QA Backend (`pytest.ini` & `app/tests/conftest.py`)
- `pytest.ini` define `asyncio_mode = auto`, markers `slow` e `asyncio`, e filtra `DeprecationWarning` de Google GenAI e Supabase.
- `conftest.py` carrega `.env.test` (`override=True`) e aborta (`pytest.exit`) se `DATABASE_URL` não estiver definida (PostgreSQL obrigatório; SQLite proibido).
- `setup_db` (`scope="session", autouse=True`) executa `Base.metadata.drop_all` e `create_all`; `db_session` faz `rollback()` ao final de cada teste.
- `client` faz override de `get_db` e desativa rate limiting (`limiter.enabled = False`).
- Fixtures DRY disponíveis: `generate_valid_cpf`, `generate_valid_cnpj`, `test_user`, `auth_headers`, `test_company`, `test_category`, `test_doc_type`, `test_emission_rule`, `admin_user`, `admin_headers`.
- `mock_email_service` (`autouse=True`) faz patch em `EmailService` (`send_verification_email`, `send_new_company_alert`, `send_password_reset_email`, `send_email_recovery_email`).

### 3. QA Frontend & E2E (`fix/divida-tecnicas` — HEAD `4581d9d2`)
- **Scripts (`frontend/package.json`):** `dev`, `build` (`cross-env NODE_OPTIONS="--max-old-space-size=4096" tsc -b && vite build`), `lint`, `test` (`vitest`), `coverage` (`vitest run --coverage`), `type-check` (`tsc --noEmit`), `test:e2e` (`playwright test`).
- **Vitest (`frontend/vite.config.ts` & `src/test/setup.ts`):** `globals: true`, `environment: 'jsdom'`, `css: false`, coverage `v8`. `setup.ts` mocka `@react-pdf/renderer`, `docx`, `file-saver` e `window.URL.createObjectURL`, com `cleanup()` no `afterEach`.
- **Isolamento E2E:** `vite.config.ts` define `test.exclude: ['e2e/**', 'node_modules/**', 'dist/**']` para impedir que o Vitest execute specs do Playwright.
- **Playwright (`frontend/playwright.config.ts` & `frontend/e2e/`):**
  - `testDir: './e2e'`, `fullyParallel: true`, `forbidOnly: !!process.env.CI`, `retries: process.env.CI ? 2 : 0`, `workers: process.env.CI ? 1 : undefined`, `reporter: 'html'`, `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, projeto `chromium` (`Desktop Chrome`).
  - `baseURL` usa `PLAYWRIGHT_BASE_URL` (padrão `http://localhost:5173`); `webServer` roda `npm run dev` (desativado se `PLAYWRIGHT_SKIP_WEBSERVER=true`).
  - `frontend/e2e/auth-and-upload.spec.ts` intercepta APIs via `page.route` (`/auth/token`, `/users/me`, `/users/me/companies`, `/documents/**`, `/companies/`, `/documents/types`, `/documents/upload`), cria JWT sintético (`createMockJwt`) para `jwt-decode` no `AuthContext` e injeta `@LicitaDoc:token` e `@LicitaDoc:companyId` no `localStorage`.

### 4. Infraestrutura Docker & Nginx
- **Backend (`Dockerfile`):** `python:3.11-slim`, `WORKDIR /src`, instala `requirements.txt`, copia `app/`, `alembic.ini` e `alembic/`, expõe `8000` e inicia `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
- **Frontend (`frontend/Dockerfile` & `frontend/nginx.conf`):** Build multi-stage (`node:22-alpine` -> `nginx:alpine`), porta `80`, fallback SPA `try_files $uri $uri/ /index.html;` e cache de `6M` para assets estáticos.
- **Compose:**
  - `docker-compose.yml`: `db` (`postgres:15-alpine`, `licitadocs_db`, porta `5433:5432`, volume `postgres_data`).
  - `docker-compose.test.yml`: `db-test` (`postgres:15-alpine`, `licitadocs_db_test`, porta `5435:5432`, `tmpfs /var/lib/postgresql/data`, `healthcheck`).
  - `docker-compose.staging.yaml`: `backend` (build local `:8000`, `env_file: .env`) e `frontend` (`ghcr.io/engmacieira/licitadocs-frontend:latest`, porta `80`).

### 5. Governança Operacional (`AGENTS.md` & `graphify.md`)
- Consultar `graphify-out/` (`graphify query` / `GRAPH_REPORT.md`) antes de varrer arquivos e rodar `graphify update .` após alterações estruturais.
- Seguir **Zero Guessing Policy**, **PostgreSQL Mandatory**, rastreabilidade no Linear (equipe `LIC`, `In Progress` -> `Done`) e Conventional Commits com chave da issue (ex.: `feat(core): LIC-12 ...`).

## Armadilhas, Legados e O Que Evitar
- **`jules/` (`instrucoes_jules.md` e scripts `.py`):** Legado sem workflow ativo em `.github/workflows/`. **Não** aplicar a "Zero-Test Policy" nem o prefixo `🤖 AI (Jules):` em fluxos atuais.
- **`infra/tinybird/` (`README.md` e `.datasource`):** Schemas (`audit_logs`, `ai_usage`, `messages`, `emission_requests`) planejados, mas **sem integração Python ativa** em `app/`.
- **Resíduos na raiz do repositório:** `licita_doc.db` (SQLite residual — uso de SQLite é proibido), `debug_models.py`, `fix_download_v2.py`, `fix_download_v3.py`, `test_resend_smtp.py` e `verify_auth_pages.spec.ts` (spec legado fora de `frontend/e2e/`). Não usar como referência nem reativar.
- **Misturar E2E com Vitest:** Nunca colocar specs Playwright fora de `frontend/e2e/` sem atualizar `test.exclude` em `vite.config.ts`.
- **Quebrar mocks globais:** Não remover `mock_email_service` no `conftest.py` nem os mocks de `@react-pdf/renderer`, `docx` e `file-saver` em `frontend/src/test/setup.ts`.

## Checklist de Validação Antes de Concluir
- [ ] Testes backend rodando contra PostgreSQL (`docker-compose.test.yml` na porta `5435` e `.env.test`), sem SQLite.
- [ ] `cd frontend && npx vitest run` passando sem capturar arquivos de `frontend/e2e/`.
- [ ] `cd frontend && npm run type-check` e `npm run test:e2e` (quando aplicável a fluxos UI/E2E) validados.
- [ ] Alterações em `ci.yml`, `Dockerfile` ou `docker-compose*.yml` mantêm compatibilidade com sharding, portas (`5433`/`5435`/`8000`/`80`) e `nginx.conf`.
- [ ] Grafo atualizado (`graphify update .`) após mudança estrutural e issue atualizada no Linear.
