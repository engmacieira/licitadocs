---
name: pncp-crm-payments
description: Diretrizes para prospecção de leads via PNCP (CRM administrativo com controle anti-SPAM) e fluxo de assinaturas/pagamentos via Infinite Pay (checkout, webhook idempotente e sandbox).
---

# PNCP CRM de Leads & Pagamentos (Infinite Pay)

## Quando Acionar (Gatilhos)
- **Parte A (PNCP & CRM de Leads):** alterações na captura de fornecedores na API pública do PNCP, filtros/listagem administrativa, regra de janela anti-SPAM ou UI em `pages/Admin/Leads/`.
- **Parte B (Pagamentos & Infinite Pay):** criação de checkout, planos/ciclos (`PRO`/`ENTERPRISE`), validação de assinatura de webhook, idempotência de eventos, atualização da `Company` ou fluxo em `features/Payment/`.

## Fonte de Verdade no Código

### Parte A: PNCP & CRM de Leads
- **Model:** [pncp_lead_model.py](file:///e:/Projetos%20VSCODE/licitadocs/app/models/pncp_lead_model.py) (`PncpLead`, tabela `pncp_leads`, `SoftDeleteMixin`)
- **Schemas:** [pncp_lead_schemas.py](file:///e:/Projetos%20VSCODE/licitadocs/app/schemas/pncp_lead_schemas.py) (`PncpLeadUpsert`, `PncpLeadResponse`, `compute_cooldown_status`)
- **Repository:** [pncp_lead_repository.py](file:///e:/Projetos%20VSCODE/licitadocs/app/repositories/pncp_lead_repository.py) (`PncpLeadRepository`)
- **Service:** [pncp_service.py](file:///e:/Projetos%20VSCODE/licitadocs/app/services/pncp_service.py) (`PncpService`)
- **Router:** [pncp_lead_router.py](file:///e:/Projetos%20VSCODE/licitadocs/app/routers/pncp_lead_router.py) (`/admin/leads`)
- **Frontend Service & Types:** [pncpLeadService.ts](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/services/pncpLeadService.ts), [pncpLead.ts](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/types/pncpLead.ts)
- **Frontend Pages (não migrado para `features/`):**
  - [index.tsx](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/pages/Admin/Leads/index.tsx) (`AdminLeadsPage`)
  - [SyncLeadsModal.tsx](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/pages/Admin/Leads/SyncLeadsModal.tsx)
  - [ContactLeadModal.tsx](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/pages/Admin/Leads/ContactLeadModal.tsx)
  - [leadFormatters.ts](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/pages/Admin/Leads/leadFormatters.ts) e `index.test.tsx`

### Parte B: Pagamentos & Infinite Pay
- **Model:** [payment_model.py](file:///e:/Projetos%20VSCODE/licitadocs/app/models/payment_model.py) (`PaymentEvent`, tabela `payment_events`)
- **Schemas:** [payment_schemas.py](file:///e:/Projetos%20VSCODE/licitadocs/app/schemas/payment_schemas.py) (`CheckoutCreateRequest`, `CheckoutCreateResponse`, `PaymentStatusResponse`, `InfinitePayWebhookPayload`)
- **Repository:** [payment_repository.py](file:///e:/Projetos%20VSCODE/licitadocs/app/repositories/payment_repository.py) (`PaymentRepository`)
- **Service:** [payment_service.py](file:///e:/Projetos%20VSCODE/licitadocs/app/services/payment_service.py) (`PaymentService`)
- **Router:** [payment_router.py](file:///e:/Projetos%20VSCODE/licitadocs/app/routers/payment_router.py) (`/payments`)
- **Env:** [.env.example](file:///e:/Projetos%20VSCODE/licitadocs/.env.example) (`INFINITEPAY_*`)
- **Frontend Service & Types:** [paymentService.ts](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/services/paymentService.ts), [payment.ts](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/types/payment.ts)
- **Frontend Feature:**
  - [PaymentOrchestrator.tsx](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/features/Payment/PaymentOrchestrator.tsx) e `PaymentOrchestrator.spec.tsx`
  - [PaymentSuccessOrchestrator.tsx](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/features/Payment/PaymentSuccessOrchestrator.tsx)
  - `components/`: `InfinitePayCheckoutForm.tsx`, `OrderSummary.tsx`, `PaymentSuccess.tsx`

## Arquitetura, Regras e Padrões Ativos

### Parte A: PNCP & CRM de Leads
1. **Acesso Restrito (Admin):** todos os endpoints em `/admin/leads` exigem `require_role([UserRole.ADMIN.value])`:
   - `GET /admin/leads`: paginação (`skip`/`limit`), busca textual (`cnpj`, `razao_social`, `nome_fantasia`, `email`), filtro `uf`, filtro `contact_status` (`all`, `ready`, `cooldown`, `never_contacted`) e `stats` (`PncpLeadStats`).
   - `POST /admin/leads/sync`: recebe `PncpLeadSyncRequest` (`uf`, `dias_retroativos` 1..90, `codigo_modalidade`, `max_paginas`, `tamanho_pagina`).
   - `POST /admin/leads/{lead_id}/contact`: registra `channel`, `notes` e `cooldown_days` opcional; retorna `was_in_cooldown` e `warning_message`.
   - `GET /admin/leads/{lead_id}`: detalhe completo com status anti-SPAM calculado.
2. **Normalização e Validação:** `PncpLead` exige `cnpj` único com 14 dígitos (validado via `validar_matematica_cnpj` em `PncpLeadUpsert`) e `spam_cooldown_days` default `7`.
3. **Extração Resiliente (`PncpService`):**
   - Usa `httpx.AsyncClient` (`DEFAULT_TIMEOUT = 20.0`, `MAX_ITEMS_PER_CONTRATACAO = 10`) consultando `PNCP_CONSULTA_URL` e itens/resultados em `PNCP_API_BASE_URL`.
   - Deduplica `seen_cnpjs` na execução e acumula falhas de rede/HTTP em `summary.errors` sem derrubar o sync.
4. **Upsert Seguro:** `PncpLeadRepository.upsert_from_pncp` atualiza dados cadastrais preservando `last_contacted_at`, `contact_count`, `last_contact_channel`, `last_contact_notes` e `spam_cooldown_days`.
5. **Cálculo de Cooldown:** `_build_cooldown_expressions` usa `func.make_interval(0, 0, 0, effective_days)` no PostgreSQL; `PncpLeadResponse` calcula `is_in_cooldown` e `cooldown_remaining_days` via `compute_cooldown_status`.
6. **Frontend (Não Migrado para `features/`):**
   - `frontend/src/pages/Admin/Leads/` concentra `AdminLeadsPage`, `SyncLeadsModal`, `ContactLeadModal` e `leadFormatters.ts` diretamente em `pages/`.
   - **Registro explícito:** `pages/Admin/Leads/` ainda não foi migrado para `frontend/src/features/`.

### Parte B: Pagamentos & Infinite Pay
1. **Autorização de Rotas (`/payments`):**
   - `POST /payments/checkout`: exige `verify_company_access(..., required_role=UserCompanyRole.MASTER.value)` (ou `ADMIN`).
   - `GET /payments/status/{company_id}`: exige `verify_company_access`.
   - `POST /payments/webhook/infinitepay`: público, validado por assinatura/segredo.
2. **Checkout Real vs. Sandbox (`PaymentService.create_checkout`):**
   - Gera `order_nsu = f"licita-{company_id[:8]}-{uuid4().hex[:12]}"` e usa `PLAN_PRICING_CENTS` (`PRO`: 19900 mensal / 199000 anual; `ENTERPRISE`: 49900 mensal / 499000 anual).
   - Com `INFINITEPAY_ENABLED=true` e `INFINITEPAY_HANDLE`, envia `POST {INFINITEPAY_API_URL}/invoices/public/checkout/links`.
   - Sem integração habilitada: retorna `503` se `ENV == "production"`, ou URL sandbox (`/payment/success?order_nsu=...&mode=sandbox`) em dev/staging.
3. **Autenticação de Webhook (`verify_webhook_signature`):**
   - Aceita HMAC-SHA256 em `X-InfinitePay-Signature` (com ou sem `sha256=`), `X-Webhook-Secret` ou `Authorization: Bearer` contra `INFINITEPAY_WEBHOOK_SECRET`.
   - Segredo vazio só é aceito quando `ENV != "production"`.
4. **Idempotência e Auditoria (`PaymentEvent`):**
   - `payment_events` (sem `SoftDeleteMixin`) exige `idempotency_key` única (`checkout:{order_nsu}` no checkout; `webhook:{id}` ou `webhook:{order_nsu}:{transaction_nsu}:{status}` no webhook).
   - Eventos repetidos retornam `{"status": "already_processed", "idempotent": True}`.
5. **Ciclo de Assinatura (`process_webhook`):**
   - Resolve a `Company` por `payload.company_id`, evento prévio via `order_nsu` ou `Company.subscription_external_id`.
   - Status em `ACTIVATION_STATUSES` ativam `is_payment_active=True` e somam 30 dias (`monthly`) ou 365 dias (`annual`) em `subscription_current_period_end`.
   - Status em `DEACTIVATION_STATUS_MAP` definem `is_payment_active=False` e atualizam `subscription_status`.
6. **Frontend (`features/Payment/`):**
   - `PaymentOrchestrator` cria checkout (`PRO`, `annual`) e redireciona para URL externa (`window.location.assign`) ou rota sandbox (`navigate`).
   - `PaymentSuccessOrchestrator` lê `order_nsu`/`mode`, consulta `paymentService.getStatus` e chama `reloadContext()` ao confirmar.

## Armadilhas, Legados e O Que Evitar
- **Parte A — Estrutura Frontend:** não procure ou crie imports em `features/AdminLeads/`; a implementação ativa reside em `frontend/src/pages/Admin/Leads/`.
- **Parte A — Dependência de PostgreSQL:** `_build_cooldown_expressions` usa `func.make_interval`, incompatível com SQLite; nunca altere o driver de testes para SQLite.
- **Parte A — Histórico Anti-SPAM:** nunca limpe ou sobrescreva campos de contato durante `upsert_from_pncp`.
- **Parte B — Componente Legado:** `MockPaymentForm.tsx` (e `MockPaymentForm.spec.tsx`) em `frontend/src/features/Payment/components/` é placeholder visual legado e **não é utilizado** por `PaymentOrchestrator.tsx`.
- **Parte B — Payload Flexível e Segurança:** `InfinitePayWebhookPayload` usa `ConfigDict(extra="allow")` por variações de campos da Infinite Pay; não remova `extra="allow"` nem desabilite `INFINITEPAY_WEBHOOK_SECRET` em produção.
- **Notificações (`sonner`):** proibido usar `toast.warning()` (inexistente no `sonner`); use `toast()` para avisos e `toast.error()` para falhas.

## Checklist de Validação Antes de Concluir
- [ ] **Parte A:** validar que `PncpLeadUpsert` rejeita CNPJs inválidos e que `upsert_from_pncp` preserva `last_contacted_at`, `contact_count` e `spam_cooldown_days`.
- [ ] **Parte A:** testar `GET /admin/leads` com filtros `ready`, `cooldown` e `never_contacted` em PostgreSQL e rodar `frontend/src/pages/Admin/Leads/index.test.tsx`.
- [ ] **Parte B:** validar `create_checkout` (sandbox e mock HTTP Infinite Pay) e `process_webhook` (ativação, desativação e retorno `already_processed` na segunda chamada).
- [ ] **Parte B:** confirmar HTTP `401` para webhook com assinatura inválida e executar `PaymentOrchestrator.spec.tsx` e `PaymentSuccess.spec.tsx` no Vitest.
