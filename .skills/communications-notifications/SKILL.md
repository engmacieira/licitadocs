---
name: communications-notifications
description: Orienta alterações em mensageria interna (tickets/broadcasts), templates e disparos de E-mail (Resend), notificações via WhatsApp (Evolution API) e alertas automáticos de documentos.
---

# Comunicações, Mensageria & Notificações Multicanal

## Quando Acionar (Gatilhos)
- Alterações no modelo `Message`, fluxo de tickets/threads, leitura, resolução ou broadcasts (`AdminInbox` / `HelpCenter`).
- Mudanças no serviço de E-mail (`EmailService`) ou nos templates HTML em `app/templates/`.
- Evolução ou depuração do adapter `WhatsAppService`, normalização de telefones brasileiros ou variáveis `WHATSAPP_*`.
- Ajustes no disparo automático de alertas de vencimento/irregularidade (`DocumentNotificationService` e `POST /admin/notifications/documents/dispatch`).
- Alterações no painel operacional `WhatsAppSection.tsx` (`ManualEmission`) ou no polling `useUnreadCount`.

## Fonte de Verdade no Código
- **Model & Schemas:**
  - [message_model.py](file:///e:/Projetos%20VSCODE/licitadocs/app/models/message_model.py) — entidade `Message` (`SoftDeleteMixin`, threads via `parent_id`, `related_document_id`).
  - [message_schemas.py](file:///e:/Projetos%20VSCODE/licitadocs/app/schemas/message_schemas.py) — `MessageCreate`, `MessageResponse`, `MessageBroadcast`.
- **Repositório & Routers:**
  - [message_repository.py](file:///e:/Projetos%20VSCODE/licitadocs/app/repositories/message_repository.py) — `MessageRepository` (herda `BaseRepository[Message]`).
  - [message_router.py](file:///e:/Projetos%20VSCODE/licitadocs/app/routers/message_router.py) — prefixo `/messages` (tickets, leitura, contagem e broadcast).
  - [admin_router.py](file:///e:/Projetos%20VSCODE/licitadocs/app/routers/admin_router.py#L270-L285) — `POST /admin/notifications/documents/dispatch`.
- **Serviços & Templates:**
  - [email_service.py](file:///e:/Projetos%20VSCODE/licitadocs/app/services/email_service.py) — `EmailService` + `app/templates/*.html` (`welcome_email.html`, `reset_password.html`, `recover_email.html`, `send_new_company_alert.html`, `resend_verification.html`).
  - [whatsapp_service.py](file:///e:/Projetos%20VSCODE/licitadocs/app/services/whatsapp_service.py) — `WhatsAppService`.
  - [document_notification_service.py](file:///e:/Projetos%20VSCODE/licitadocs/app/services/document_notification_service.py) — `DocumentNotificationService`.
  - [.env.example](file:///e:/Projetos%20VSCODE/licitadocs/.env.example#L73-L88) — credenciais `SMTP_*`, `EMAILS_FROM_*`, `WHATSAPP_*` e `DOCUMENT_EXPIRATION_ALERT_DAYS`.
- **Frontend:**
  - [InboxOrchestrator.tsx](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/features/AdminInbox/InboxOrchestrator.tsx) e componentes (`InboxSidebar`, `TicketConversation`, `BroadcastViewer`, `NewBroadcastModal`).
  - [HelpCenterOrchestrator.tsx](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/features/HelpCenter/HelpCenterOrchestrator.tsx) e componentes (`ContactSidebar`, `HelpCenterTabs`, `TicketChat`, `AlertViewer`, `NewTicketModal`).
  - [WhatsAppSection.tsx](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/features/ManualEmission/components/WhatsAppSection.tsx) e [useUnreadCount.ts](file:///e:/Projetos%20VSCODE/licitadocs/frontend/src/hooks/useUnreadCount.ts).

## Arquitetura, Regras e Padrões Ativos

### 1. Caixa de Mensagens & Segurança (`message_router.py` / `MessageRepository`)
- `Message` herda `SoftDeleteMixin`; toda consulta deve usar `MessageRepository.get_active_query(db)` ou `get_by_id`.
- `message_type` aceita `'chat'` (suporte), `'system'` (alerta/broadcast) e `'action_required'` (pendência). `sender_id=None` indica aviso automático do sistema.
- Em `POST /messages/{company_id}`, não-admins têm `message_type` forçado para `'chat'` (anti-spoofing) e `parent_id` validado contra a mesma `company_id` (anti-IDOR).
- `mark_ticket_thread_as_read` marca como lidas apenas mensagens do lado oposto (admin lê mensagens de `CLIENT`; cliente lê mensagens de `ADMIN` ou `system`).
- Endpoints principais: `GET /messages/{company_id}`, `PATCH /messages/{message_id}/read`, `PATCH /messages/ticket/{ticket_id}/read`, `PATCH /messages/{message_id}/resolve`, `GET /messages/admin/all`, `GET /messages/admin/alerts`, `GET /messages/admin/unread-count`, `GET /messages/{company_id}/unread-count`.
- `POST /messages/admin/broadcast` filtra empresas ativas via `CompanyRepository.get_active_query(db)` e usa `MessageRepository.create_bulk` para evitar N+1/DoS.

### 2. E-mail (`EmailService`)
- Envia HTML assíncrono via API HTTP do Resend (`https://api.resend.com/emails`, `httpx.AsyncClient`, timeout 30s) usando `settings.SMTP_PASSWORD` (API key), `EMAILS_FROM_EMAIL` e `EMAILS_FROM_NAME`.
- Métodos de template (Jinja2 em `app/templates/`): `send_password_reset_email`, `send_verification_email`, `send_email_recovery_email` e `send_new_company_alert`.
- Sem credenciais configuradas, imprime mock em stdout/log e retorna `False`.

### 3. WhatsApp (`WhatsAppService`)
- Adapter assíncrono HTTP compatível com Evolution API: `{WHATSAPP_API_URL}/message/sendText/{WHATSAPP_INSTANCE}` (ou `/message/sendText` sem instância), enviando headers `apikey` e `Authorization: Bearer`.
- `normalize_phone` remove não-dígitos, prefixa `'55'` para 10–11 dígitos e mantém `55` com 12–13 dígitos (retorna `None` se inválido).
- No-op seguro (retorna `False` sem lançar exceção) quando `WHATSAPP_ENABLED=False`, sem `WHATSAPP_API_URL`/`WHATSAPP_API_TOKEN`, telefone inválido ou falha/timeout (`WHATSAPP_TIMEOUT_SECONDS`).
- `send_document_alert` formata mensagens para `expiring`/`vencimento`/`a_vencer`, `expired`/`vencido` e `irregular`/`irregularidade`.

### 4. Alertas Automáticos de Documentos (`DocumentNotificationService`)
- Acionado por `POST /admin/notifications/documents/dispatch` (`days` de 1 a 365, `dry_run`, restrito a `ADMIN`).
- **Fronteira com `document-vault-crawlers`:** apenas consome `DocumentRepository.get_expiring_global` e `get_irregular_global`; não altera regras de vencimento, parsing ou crawlers.
- **Deduplicação na tabela `messages`:** `_has_recent_notification` bloqueia reenvio se existir `Message` ativa (`deleted_at IS NULL`, `message_type="system"`, mesmo `company_id` e `related_document_id`) com prefixo `[Alerta Vencimento]` (janela `max(1, days)`) ou `[Alerta Irregularidade]` (janela `max(1, irregular_cooldown_days)`, padrão 1 dia).
- **Ordem de contato:** telefone (`company.whatsapp` → `company.telefone` → `company.owner.celular`); e-mail (`company.email_corporativo` → `company.owner.email`).
- Dispara WhatsApp + E-mail (com `html.escape`) e persiste `Message(sender_id=None, message_type="system")` com `db.commit()` ao final (exceto `dry_run=True`), retornando métricas (`notifications_sent`, `whatsapp_sent`, `email_sent`, `skipped_duplicates`, `skipped_no_contact`).

### 5. Frontend (`AdminInbox`, `HelpCenter`, `ManualEmission`, `useUnreadCount`)
- `InboxOrchestrator` (`AdminInbox`) gerencia abas `'tickets'` e `'alerts'`, filtros (`selectedCompanyId`, `statusFilter`, `searchTerm`, `sortOrder`), respostas em thread e modal de broadcast.
- `HelpCenterOrchestrator` separa `alerts` (`message_type === 'system'`) de `parentTickets` (`chat` / `action_required` com `parent_id === null`).
- `useUnreadCount` faz polling leve a cada 10 minutos (`600000` ms) em `/messages/admin/unread-count` ou `/messages/{company_id}/unread-count`.
- `WhatsAppSection.tsx` exibe `rule.contact_whatsapp` (read-only), edita `whatsappBody` e desabilita envio quando `!rule.contact_whatsapp || !selectedCompanyId`.

### 6. Variáveis de Ambiente (`.env.example`)
- **E-mail:** `SMTP_PASSWORD` (API key Resend), `EMAILS_FROM_EMAIL`, `EMAILS_FROM_NAME`, `ADMIN_EMAIL_NOTIFICATIONS`.
- **WhatsApp & Alertas:** `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN`, `WHATSAPP_INSTANCE`, `WHATSAPP_ENABLED` (`false` por padrão), `WHATSAPP_TIMEOUT_SECONDS` (`15`), `DOCUMENT_EXPIRATION_ALERT_DAYS` (`15`).

## Armadilhas, Legados e O Que Evitar
- **Envio simulado em `ManualEmission`:** `handleSendWhatsApp` em `EmissionOrchestrator.tsx` é dívida técnica — apenas simula o agendamento com `toast.success` sem chamar o backend; não assuma envio real sem criar a rota/integração.
- **Prefixos de deduplicação acoplados:** alterar `EXPIRING_SUBJECT_PREFIX` (`[Alerta Vencimento]`) ou `IRREGULAR_SUBJECT_PREFIX` (`[Alerta Irregularidade]`) quebra a deduplicação de alertas já gravados em `messages`.
- **Variável `SMTP_PASSWORD`:** no `EmailService`, `settings.SMTP_PASSWORD` armazena a API key HTTP do Resend (não é conexão SMTP tradicional).
- **Alias legado:** `EmailService.send_verification_email_html` existe apenas por retrocompatibilidade; prefira `send_verification_email`.
- **Notificações no Frontend:** `sonner` não suporta `toast.warning()`; use `toast.error()`, `toast.success()` ou `toast()`.

## Checklist de Validação Antes de Concluir
- [ ] Queries em `Message` respeitam `SoftDeleteMixin` (`deleted_at IS NULL` / `get_active_query`).
- [ ] `EmailService` e `WhatsAppService` mantêm fallback/no-op seguro sem lançar exceções quando desabilitados ou sem credenciais.
- [ ] Alterações em `DocumentNotificationService` preservam deduplicação por prefixo/janela e sanitização `html.escape`.
- [ ] Não houve alteração fora do escopo de mensageria/notificações (ex.: regras de crawlers ou parser documental).
- [ ] Testes backend (PostgreSQL) e frontend (`*.spec.tsx` via Vitest) da área afetada executados e aprovados.
