---
name: document-vault-crawlers
description: Guia de arquitetura, segurança e padrões para o Cofre Digital (Document/Certificate), Catálogo, Regras de Emissão, Fila Manual e Robôs Crawlers do LicitaDocs. Acione ao alterar upload/download/ZIP de documentos, regras de emissão, crawlers ou as features frontend do cofre e monitoramento.
---

# Document Vault, Catálogo & Crawlers

## Quando Acionar (Gatilhos)
- Alterações em upload, listagem unificada, download, exportação `.zip`, exclusão (Soft Delete) ou atualização de metadados de `Document` e `Certificate`.
- Criação/edição de `DocumentCategory`, `DocumentType`, `DocumentAutomationConfig`, `EmissionRule` ou `EmissionRequest`.
- Implementação ou manutenção de robôs em `app/services/crawlers/` e do `OrchestratorService`.
- Mudanças nas features frontend `ClientVault`, `DocumentVault`, `CatalogSettings`, `EmissionRules`, `ManualEmission` e `ValidityMonitor`.

## Fonte de Verdade no Código
### Backend
- **Routers:**
  - `app/routers/document_router.py` (`/documents`: `/types`, `/`, `/expiring`, `/irregular`, `/upload`, `/{item_id}/download`, `/export/zip`, `DELETE /{item_id}`, `PATCH /{document_id}`).
  - `app/routers/emission_rule_router.py` (`/emission-rules`: `/`, `/resolve`, `/{rule_id}`, `/{rule_id}/requests`, `PATCH /requests/{request_id}`).
- **Repositories:**
  - `app/repositories/document_repository.py` (`DocumentRepository`: catálogo, `create_legacy`, `create_certificate`, `get_unified_by_company`, `get_file_path`, `update_metadata`, `get_expiring_global`, `get_irregular_global`).
  - `app/repositories/emission_rule_repository.py` (`EmissionRuleRepository` herda `BaseRepository`, com `resolve_rule_for_company`).
  - `app/repositories/emission_request_repository.py` (`EmissionRequestRepository` herda `BaseRepository`, com `get_by_rule_and_company`, `create`, `update`).
- **Models & Schemas:**
  - `app/models/document_model.py` (`Document`, `DocumentStatus`: `valid`, `warning`, `expired`, `pending`).
  - `app/models/certificate_model.py` (`Certificate`, `CertificateStatus`: `valid`, `warning`, `expired`, `processing`, `error`, `archived`, `pending`).
  - `app/models/document_category_model.py` (`DocumentCategory`) e `app/models/document_type_model.py` (`DocumentType`, `DocumentScope`: `NATIONAL`, `STATE`, `MUNICIPAL`).
  - `app/models/emission_rule_model.py` (`EmissionRule`) e `app/models/emission_request_model.py` (`EmissionRequest`, status padrão `pending`).
  - `app/schemas/document_schemas.py` (`DocumentResponse`, `DocumentStatusEnum`, `DocumentScopeEnum`, `DocumentAutomationConfigBase`).
- **Storage, Config & Automação:**
  - `app/utils/file_helper.py` (`save_upload_file`, `get_file_url`, `delete_file` via Supabase Storage).
  - `app/core/config.py` (`settings.ALLOWED_EXTENSIONS = [".pdf"]`).
  - `app/services/orchestrator_service.py` (`OrchestratorService.run_daily_scan`) e `app/main.py` (bloco APScheduler).
  - `app/services/crawlers/base_crawler.py` (`BaseCrawler`) e `app/services/crawlers/crawler_factory.py` (`CrawlerFactory`).
  - `app/services/crawlers/cartao_cnpj_crawler.py` (`CartaoCNPJCrawler`), `fgts_crawler_v1.py` (`FGTSCrawlerV1`), `tst_crawler_v1.py` (`TSTCrawlerV1`).

### Frontend (`frontend/src/features/`)
- `ClientVault/ClientVaultOrchestrator.tsx` — cofre do cliente; oculta `is_client_upload`, filtra e aciona `documentService.downloadAllValidZip`.
- `DocumentVault/DocumentVaultOrchestrator.tsx` + `hooks/useDocumentVault.ts` — gestão admin (`clientUploads` vs `officialVault`, `UploadModal`, `EditDocumentModal`, `CompanyVault`, `pending_docs_notes`).
- `CatalogSettings/SettingsOrchestrator.tsx` — CRUD de categorias e tipos (`CategoryModal`, `TypeModal`).
- `EmissionRules/RulesOrchestrator.tsx` — diretórios por aba (`NATIONAL`, `STATE`, `MUNICIPAL`).
- `ManualEmission/EmissionOrchestrator.tsx` — templates de E-mail/WhatsApp e fila `emissionRequestService`.
- `ValidityMonitor/MonitorOrchestrator.tsx` — monitor global admin de pendências (`/irregular`) e vencimentos (`/expiring?days=`).

## Arquitetura, Regras e Padrões Ativos
1. **Modelo Dual Unificado (`Document` vs `Certificate`):**
   - Uploads sem `type_id` criam `Document` (legado/manual); com `type_id` criam `Certificate` estruturado.
   - `DocumentRepository.create_certificate` arquiva (`status="archived"`) versões ativas anteriores do mesmo `(company_id, type_id)` antes de persistir a nova certidão.
   - `DocumentRepository.get_unified_by_company` unifica ambos no schema `DocumentResponse`.
2. **Upload Seguro & Supabase Storage:**
   - Extensões permitidas centralizadas em `settings.ALLOWED_EXTENSIONS` (`[".pdf"]`, padronizado em `fix/divida-tecnicas`) e validadas em `document_router.py` junto com limite de 5 MB e magic number `%PDF-`.
   - Buckets dinâmicos: `"documentos-usuarios"` (`is_client_upload=True`) e `"cofre-digital"` (Admin/Crawler). Em falha no DB, o router executa rollback físico via `delete_file(file_path)`.
   - `file_path="SEM_ANEXO"` e `filename="Registo de Pendência"` são aceitos quando `file` é omitido.
3. **Blindagem Multi-Tenant, IDOR/BOLA e Soft Delete:**
   - `GET /documents/{item_id}/download` aplica `@limiter.limit("60/minute")`, filtra `deleted_at.is_(None)`, valida `company_links` ativos para não-admins (anti-IDOR/BOLA) e retorna `RedirectResponse` com URL assinada (`get_file_url`).
   - `emission_rule_router.py` usa `verify_company_access` nas rotas de `requests` e `BaseRepository` (`get_active_query`, `soft_delete`).
   - `DELETE /documents/{item_id}` aplica Soft Delete (`deleted_at = datetime.now()`) preservando o arquivo no storage.
4. **Exportação em Lote (`.zip` em Streaming):**
   - `GET /documents/export/zip` usa `stream_zip.async_stream_zip` (`ZIP_64`) em streaming O(1) de RAM, filtrando `is_client_upload=False` e status `["valid", "warning"]`.
5. **Resolução Geográfica & Emissão Manual:**
   - `EmissionRuleRepository.resolve_rule_for_company` cruza `DocumentType.scope` (`NATIONAL`, `STATE`, `MUNICIPAL`) com `Company.estado`/`cidade`.
6. **Crawlers (Strategy Pattern) & Orquestrador:**
   - Todo robô herda `BaseCrawler` e implementa `fetch() -> dict` retornando `success`, `message`, `file_metadata` (`filename`, `expiration_date`, `is_structured`) e `file_content` (`bytes`).
   - `CrawlerFactory._strategies` mapeia `"TST_CRAWLER_V1"` (`TSTCrawlerV1` via `requests`), `"CARTAO_CNPJ_BRASIL_API"` (`CartaoCNPJCrawler` via BrasilAPI + `FPDF`) e `"FGTS_CRAWLER_V1"` (`FGTSCrawlerV1` via `sync_playwright`).
   - `OrchestratorService.run_daily_scan` consulta `DocumentAutomationConfig` (`is_automatable=True`, `deleted_at.is_(None)`) e renova certidões ausentes ou com vencimento `< 5` dias.
7. **Fronteira com `communications-notifications`:**
   - Este domínio apenas cria o alerta interno quando `status in ["error", "irregular"]` no upload (`MessageRepository.create` com `message_type="action_required"`) e registra intenções em `ManualEmission`; envio SMTP/WhatsApp, inbox e broadcasts pertencem à skill `communications-notifications`.

## Armadilhas, Legados e O Que Evitar
- **APScheduler desativado:** Em `app/main.py` (linhas 107–133), o `BackgroundScheduler` que agenda `OrchestratorService.run_daily_scan` está comentado em string multilinha; não assuma execução automática em background sem reativá-lo ou usar worker dedicado.
- **Legado/POC de Crawler:** `app/services/crawlers/tst_crawler_poc.py` (`TSTCrawlerPoC`) é um mock legado que retorna PDF falso (`b"%PDF-1.4\n%Fake TST..."`). Além disso, `TSTCrawlerV1` ainda usa URL de teste (`pdfobject.com`). Não registrar `TSTCrawlerPoC` na `CrawlerFactory`.
- **Divergência no `.zip` streaming:** `export_valid_documents_zip` valida `os.path.exists(file_path)` e lê via `aiofiles.open`, o que falha para caminhos `"bucket/uuid.pdf"` armazenados no Supabase Storage.
- **Anti-duplicação de extensões:** Nunca hardcode `[".pdf"]` em novos endpoints; reutilize `settings.ALLOWED_EXTENSIONS`.
- **Regras Globais:** Proibido SQLite (PostgreSQL obrigatório) e proibido `toast.warning()` no frontend (`sonner`).

## Checklist de Validação Antes de Concluir
- [ ] Queries em `Document`, `Certificate`, `DocumentCategory`, `DocumentType`, `EmissionRule` e `EmissionRequest` filtram `deleted_at.is_(None)`.
- [ ] Rotas com `company_id` ou `item_id` validam acesso multi-tenant (`company_links` / `verify_company_access`).
- [ ] Uploads validam `settings.ALLOWED_EXTENSIONS`, limite de 5 MB, magic number `%PDF-` e executam `delete_file` em rollback.
- [ ] Novos crawlers herdam `BaseCrawler`, estão em `CrawlerFactory._strategies` e retornam `bytes` válidos em `file_content`.
- [ ] Frontend mantém estado nos Orchestrators/hooks, tipos em `frontend/src/types/index.ts` e testes `.spec.tsx` co-localizados.
