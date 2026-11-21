---
name: backend-core-db
description: Arquitetura central do backend FastAPI, PostgreSQL, Alembic, autenticação JWT/RBAC, multi-tenancy e auditoria do LicitaDocs. Acione ao editar rotas core, modelos, repositórios, middlewares, migrations ou validações de usuário/empresa.
---

# Backend Core & Database (FastAPI / PostgreSQL)

## Quando Acionar (Gatilhos)
- Criação ou alteração de rotas em `auth_router.py`, `user_router.py`, `company_router.py` ou `admin_router.py`.
- Alterações em `models/`, `repositories/base_repository.py`, `alembic/env.py` ou novas migrations.
- Mudanças em autenticação JWT, RBAC (`admin`/`client`, `MASTER`/`VIEWER`), multi-tenancy, rate limit ou middlewares.
- Ajustes de configuração (`Settings`), conexão PostgreSQL (`SessionLocal`), auditoria ou validadores CPF/CNPJ.

## Fonte de Verdade no Código
- **Entrypoint & Middlewares:**
  - `app/main.py` (inicialização FastAPI, Sentry, CORS, inclusão dos 11 routers e health check `/`)
  - `app/core/middleware.py` (`PayloadSizeLimitMiddleware`, limite global de 20MB)
  - `app/core/rate_limit.py` (`limiter` SlowAPI com `get_remote_address_with_proxy` via `X-Forwarded-For`)
  - `app/middlewares/audit_middleware.py` (`AuditMiddleware` com `structlog` JSON e `request_id_var`)
- **Configuração & Banco:**
  - `app/core/config.py` (`Settings` via `pydantic-settings`, `.env`, `extra="ignore"`)
  - `app/core/database.py` (`engine`, `SessionLocal`, `Base`, `SoftDeleteMixin`, `generate_uuid`, `get_db`)
  - `alembic/env.py`, `.env.example`, `scripts/reset_and_seed.py`
- **Segurança & Auth:**
  - `app/core/security.py` (`verify_password`, `get_password_hash`, `create_access_token`)
  - `app/dependencies.py` (`get_current_user`, `get_current_active_user`, `require_role`, `get_current_active_admin`, `verify_company_access`)
  - `app/routers/auth_router.py` (`/auth/register`, `/auth/oauth-register`, `/auth/token`)
- **Camada de Dados, Routers & Utils:**
  - `app/repositories/base_repository.py`, `app/models/user_model.py`, `app/models/company_model.py`
  - `app/routers/user_router.py`, `app/routers/company_router.py`, `app/routers/admin_router.py`
  - `app/utils/validators.py` (`validar_matematica_cpf`, `validar_matematica_cnpj`)
  - `docs/arquitetura-e-regras/00REGRAS_CODIGO.md` (Zero Guessing Policy e restrição absoluta de PostgreSQL)

## Arquitetura, Regras e Padrões Ativos
1. **Stack 100% PostgreSQL (`docs/arquitetura-e-regras/00REGRAS_CODIGO.md`, `app/core/database.py`):**
   - `Settings` exige `DATABASE_URL` via `.env`. Engine configurado com `pool_pre_ping=True`, `pool_size=50`, `max_overflow=150`, `pool_timeout=30`.
   - `get_db()` abre `SessionLocal()` por requisição e fecha no `finally`.
   - É terminantemente proibido usar SQLite em qualquer ambiente (inclusive testes).
2. **Padrão MVC / Repository & Soft Delete (`app/repositories/base_repository.py`):**
   - Separação estrita: `routers/` -> `services/` -> `repositories/` -> `models/` + `schemas/`.
   - Modelos herdam `Base` e `SoftDeleteMixin` (`deleted_at` timezone-aware UTC) com PK UUID string (`generate_uuid`).
   - Consultas devem usar `BaseRepository.get_active_query(db)` / `get_by_id()` / `get_all()` para filtrar `deleted_at IS NULL`.
   - `create()`, `update()` e `soft_delete()` executam `db.flush()` e disparam `AuditRepository.create_audit_log_async` via executor/thread; o `db.commit()` fica na camada chamadora (Unit of Work).
3. **Autenticação JWT & Contexto (`app/dependencies.py`, `app/core/security.py`):**
   - `get_current_user` decodifica JWT do Supabase (`SUPABASE_JWT_SECRET`, `audience="authenticated"`, `sub`=UUID) e faz fallback para `SECRET_KEY` (sem `audience`, `sub`=email).
   - Popula `user_id_var` (`app/core/context.py`) para rastreio de alterações no `AuditRepository`.
   - Hashing de senhas com `passlib` (`bcrypt`). `/auth/token` usa `DUMMY_HASH` contra timing attacks.
4. **RBAC & Multi-Tenancy (`app/dependencies.py`, `app/models/user_model.py`, `app/models/company_model.py`):**
   - Papel global (`UserRole`): `admin` | `client`. Restrito via `require_role([...])` ou `get_current_active_admin`.
   - Papel na empresa (`UserCompanyRole` em `user_company_links`, PK composta `user_id` + `company_id`): `MASTER` | `VIEWER`.
   - `verify_company_access(company_id, user, db, required_role)` libera `UserRole.ADMIN` ("chave mestra") e valida vínculo ativo (`is_active == True`, `deleted_at == None`) para clientes.
   - `Company.is_regular` exige `is_contract_signed`, `is_payment_active`, `is_admin_verified` e `owner.is_email_verified`.
5. **Isolamento de Troca de Senha (`app/routers/user_router.py`):**
   - `PATCH /users/me` bloqueia mass assignment ignorando `id`, `role`, `password_hash`, `is_active`, `password` e `current_password`.
   - Alteração de senha é isolada no endpoint dedicado `PATCH /users/me/password` (`PasswordUpdateDTO`), exigindo validação prévia via `verify_password(payload.current_password, current_user.password_hash)`.
6. **Middlewares, Rate Limit & Auditoria (`app/main.py`, `app/middlewares/audit_middleware.py`):**
   - Middlewares ativos: `SlowAPIMiddleware`, `PayloadSizeLimitMiddleware` (20MB), `AuditMiddleware` (`request_id_var` + log JSON), `CorrelationIdMiddleware` (`X-Request-ID`) e `CORSMiddleware`.
   - Swagger (`/docs`, `/redoc`) é desabilitado quando `ENV=production`.
   - Backoffice `/admin/*` (empresas, `/admin/audit-logs`, `/admin/notifications/documents/dispatch`) exige `require_role([UserRole.ADMIN.value])`.
7. **Validações e Transações (`app/utils/validators.py`, `app/routers/auth_router.py`, `app/routers/company_router.py`):**
   - `validar_matematica_cpf` e `validar_matematica_cnpj` removem pontuação (`re.sub(r'\D', '', v)`), rejeitam sequências repetidas e validam dígitos verificadores.
   - `/auth/register` e `/auth/oauth-register` (`@limiter.limit("5/minute")`) usam transação atômica com rollback de banco e remoção de arquivos salvos em caso de erro.
   - `add_member` usa savepoint (`with db.begin_nested():`) para evitar race condition na criação de usuário.

## Armadilhas, Legados e O Que Evitar
- **Fallbacks legados de SQLite:** `alembic/env.py` (`sqlite:///./licita_doc.db`, `render_as_batch=True`) e `scripts/reset_and_seed.py` (`Base.metadata.drop_all` para não-Postgres) possuem código residual de SQLite. **Nunca** utilize SQLite; configure sempre `DATABASE_URL` PostgreSQL.
- **Modelos fora do Alembic:** `alembic/env.py` só detecta tabelas no `autogenerate` se o módulo do model estiver explicitamente importado lá.
- **APScheduler comentado:** `app/main.py` mantém o `BackgroundScheduler` e `setup_concurrency` comentados — não assuma que jobs agendados estão rodando no startup.
- **OAuth2 `tokenUrl` vs rota real:** `dependencies.py` declara `OAuth2PasswordBearer(tokenUrl="/auth/login")`, mas a rota OAuth2 de emissão de token em `auth_router.py` é `POST /auth/token`.
- **Lazy Loading em `/users/me/companies`:** `read_my_companies` retorna dicionário montado manualmente para evitar expor `__dict__` do SQLAlchemy; filtre sempre `link.is_active`.
- **Mass Assignment em `/companies/{id}`:** Clientes não podem enviar `is_admin_verified`, `is_contract_signed`, `is_payment_active` ou `admin_pendencies` no `PUT`.
- **`scripts/reset_and_seed.py`:** Executa `DROP SCHEMA public CASCADE` — uso estritamente restrito a dev/teste local.

## Checklist de Validação Antes de Concluir
- [ ] Confirmar que nenhuma query consulta diretamente `db.query(Model)` ignorando `deleted_at IS NULL` (usar `BaseRepository` ou filtrar explicitamente).
- [ ] Confirmar que `DATABASE_URL` aponta para PostgreSQL e nenhum fallback SQLite foi introduzido.
- [ ] Ao criar novo model, importá-lo em `alembic/env.py` e gerar migration Alembic.
- [ ] Garantir proteção de rotas via `get_current_active_user`, `require_role` e `verify_company_access` com `required_role` quando aplicável.
- [ ] Manter `PATCH /users/me` blindado contra alteração de senha/role e usar `PATCH /users/me/password` para troca de senha.
- [ ] Validar CPF/CNPJ com `app/utils/validators.py` e preservar `db.flush()`/`commit()`/`rollback()` atômicos.
- [ ] Respeitar limites de upload (5MB por arquivo em cadastro/admin; 20MB global no `PayloadSizeLimitMiddleware`).
