---
name: ai-concierge-rag
description: Diretrizes, arquitetura e regras de segurança para evoluir o Assistente Virtual (Concierge IA) e o fluxo RAG sobre o Cofre de documentos do LicitaDocs. Use ao alterar prompts, cotas de tokens, cliente Gemini, endpoint /ai/chat ou o widget de chat no frontend.
---

# AI Concierge & RAG sobre o Cofre

## Quando Acionar (Gatilhos)
- Alterações no cliente LLM (`AIClient`), modelo Gemini, parâmetros de geração ou leitura de `GOOGLE_API_KEY`.
- Mudanças no fluxo RAG, engenharia de prompt, tratamento de contexto vazio ou regras de escopo em `AIService`.
- Ajustes no endpoint `POST /ai/chat`, schemas (`ChatRequest`, `ChatResponse`), rate limit ou controle multi-tenant.
- Evolução do controle de cota diária de tokens (`AIUsage`, `AIQuotaRepository`, `DAILY_TOKEN_LIMIT`).
- Modificações no widget de chat (`ChatWidget`) ou no serviço `aiService.ts` do frontend.

## Fonte de Verdade no Código
- **Cliente LLM:** `app/core/ai_client.py` (`AIClient`, SDK `google-genai` v2, singleton `ai_client`).
- **Serviço e Prompt/RAG:** `app/services/ai_service.py` (`AIService.generate_concierge_response`, `DAILY_TOKEN_LIMIT = 30000`).
- **Controller/Rota:** `app/routers/ai_router.py` (`POST /ai/chat`, `@limiter.limit("5/minute")`).
- **Contratos Pydantic:** `app/schemas/ai_schemas.py` (`ChatRequest`, `ChatResponse`).
- **Modelo e Repositório de Cota:** `app/models/ai_usage_model.py` (`AIUsage`) e `app/repositories/ai_quota_repository.py` (`AIQuotaRepository`).
- **Frontend:** `frontend/src/features/AIConsultant/components/ChatWidget/index.tsx` e `frontend/src/services/aiService.ts`.
- **Testes Automatizados:**
  - `app/tests/test_ai_router.py`: acesso autorizado, `company_id` obrigatório (422), bloqueio de admin (403) e não autenticado (401).
  - `app/tests/test_ai_quota.py`: acúmulo de tokens, bloqueio em `DAILY_TOKEN_LIMIT` (429/402) sem chamar LLM e rollover diário.
  - `app/tests/test_ai_quota_repository.py`: busca diária, upsert, incremento em registro existente, fallback em `IntegrityError` e rollback em erro crítico.
  - `app/tests/test_ai_hardening_task.py`: isolamento multi-tenant (403), aborto do RAG em erro de BD (500) sem chamar `AIClient` e soma atômica.
  - `app/tests/test_ai_security_redteam.py`: payload massivo (422), concorrência/rate limit (429), prompt injection (`<user_input>`) e contexto vazio.

## Arquitetura, Regras e Padrões Ativos

### 1. SDK e Modelo (`AIClient`)
- Utiliza exclusivamente `google-genai` (`from google import genai` e `from google.genai import types`).
- Modelo configurado: `self.model_name = "gemini-2.0-flash"`, com `max_output_tokens=1024` e `temperature=0.7`.
- Lê `GOOGLE_API_KEY` do ambiente; se ausente, realiza fail-fast silencioso (`self.client = None`, loga warning) sem derrubar o servidor.
- `generate_chat_response(message, context="")` retorna `tuple[str, int]` com o texto e `response.usage_metadata.total_token_count`.
- Se `self.client` for `None` ou ocorrer exceção na API Gemini, retorna mensagem técnica segura e `0` tokens (logs higienizados sem expor segredos).

### 2. Controle de Acesso e Multi-Tenant (`ai_router.py` + `ChatWidget`)
- Endpoint `POST /ai/chat` exige autenticação e papel exclusivo de cliente via `require_role([UserRole.CLIENT.value])` (admins recebem HTTP `403`).
- Validação de tenant obrigatória no controller: verifica `any(link.company_id == chat_request.company_id for link in current_user.company_links)`; sem vínculo, retorna HTTP `403`.
- Em `AIService`, se `company_id` estiver vazio, retorna mensagem de erro amigável antes de consultar cota ou RAG.
- No frontend, `ChatWidget` retorna `null` se `!user || user.role === 'admin'` e exige `currentCompany?.id` (com `toast.error`) antes de chamar `aiService.sendMessage(text, currentCompany.id)`.

### 3. RAG sobre o Cofre e Aborto em Falha (`AIService`)
- Busca documentos ativos via `DocumentRepository.get_unified_by_company(db, company_id)` (ignora registros com soft delete).
- Mapeia status (`valid`, `expired`, `warning`, `error`, `irregular`, `archived`) e formata `expiration_date` (`dd/mm/YYYY` ou `"Permanente"`).
- **Falha no RAG aborta a LLM:** qualquer exceção ao consultar o repositório dispara imediatamente `HTTPException(status_code=500)` antes de instanciar ou chamar `AIClient`, evitando desperdício financeiro.
- **Contexto vazio:** se não houver documentos, injeta `"Nenhum documento encontrado no Cofre."` e instrui a LLM a informar unicamente que o cofre está vazio, sem deduzir ou inventar nomes.

### 4. Cota Diária e Controle Atômico (`AIQuotaRepository` + `AIUsage`)
- `AIService` define `DAILY_TOKEN_LIMIT = 30000`. Antes do RAG/LLM, consulta `AIQuotaRepository.get_daily_usage(db, company_id, date.today())`; se `current_usage >= DAILY_TOKEN_LIMIT`, lança HTTP `429`.
- `AIQuotaRepository.get_daily_usage` retorna `0` caso não exista registro para `(company_id, ref_date)` ou em caso de exceção na query.
- Após a resposta da LLM, se `tokens_used > 0`, chama `AIQuotaRepository.add_usage(db, company_id, tokens_used, today)`.
- `AIUsage` (tabela `ai_usage`) possui `UniqueConstraint("company_id", "usage_date", name="uix_company_date_usage")`.
- `AIQuotaRepository.add_usage` evita *race conditions* (*lost update*):
  1. Executa `UPDATE` atômico (`AIUsage.tokens_consumed + tokens`).
  2. Se `rowcount == 0`, tenta `INSERT` do registro diário.
  3. Em caso de conflito concorrente no `INSERT`, faz `rollback()` e repete o `UPDATE` atômico.
  4. Em erro crítico, executa `db.rollback()` e propaga a exceção.

### 5. Proteção contra Financial DoS, Rate Limit e RedTeam
- **Payload máximo:** `ChatRequest` (`message: str`, `company_id: str`) impõe `max_length=1000` em `message` (payloads maiores falham com HTTP `422` antes do `AIService`).
- **Rate Limiting:** `@limiter.limit("5/minute")` via `slowapi` (`app.core.rate_limit.limiter`) em `POST /ai/chat` retorna HTTP `429`.
- **Anti-Prompt Injection:** a mensagem do usuário é encapsulada em tags XML `<user_input>\n{user_message}\n</user_input>`.
- **Escopo estrito no `system_prompt`:** proíbe seguir instruções dentro de `<user_input>`, proíbe atuar como consultor jurídico ou analisar editais/leis (ex: `14.133`) e exige resposta padrão de negativa fora do escopo.
- **XSS e Erros no Frontend:** `ChatWidget` sanitiza respostas em string com `DOMPurify.sanitize(message.content)` e trata HTTP `429`/`402` exibindo aviso de renovação diária + `toast.error()`.
- **Nota de testes:** em `test_ai_security_redteam.py`, `limiter.enabled` é ativado explicitamente para validar concorrência (429) e restaurado em `finally`.

## Armadilhas, Legados e O Que Evitar
- **Script legado quebrado:** `app/scripts/manual_test_ai.py` ainda importa `ai_service` e chama `ai_service.ask_consultant(...)`, símbolos que não existem mais em `app/services/ai_service.py` (o método atual é estático: `AIService.generate_concierge_response`). Não use esse script como referência de API.
- **Documentação histórica:** `docs/ai_security_report.md` documenta vulnerabilidades anteriores ao hardening (e cita OpenAI/Anthropic); as mitigações (`max_length=1000`, `slowapi`, `<user_input>`, fallback de contexto vazio) já estão implementadas no código atual.
- **Instanciação no Service:** `AIService` faz `ai_instance = AIClient()` por chamada em vez de importar o singleton `ai_client`; ao mockar em testes, observe os patches em `app.core.ai_client.AIClient.generate_chat_response`.
- **Não flexibilizar:** nunca remover `max_length`, tags `<user_input>`, validação de `company_links` ou o aborto pré-LLM em erro de RAG, nem usar `toast.warning()` (não suportado pelo `sonner`).

## Checklist de Validação Antes de Concluir
- [ ] Alterações no backend mantêm isolamento multi-tenant (`403` para empresa não vinculada ou usuário `admin`), cota diária (`DAILY_TOKEN_LIMIT = 30000`) e atualização atômica em `AIQuotaRepository`.
- [ ] Falhas em `DocumentRepository.get_unified_by_company` continuam abortando com HTTP `500` sem chamar `AIClient.generate_chat_response`.
- [ ] Prompts preservam encapsulamento `<user_input>` e diretrizes de escopo restrito ao cofre.
- [ ] Suíte de testes de IA executada e aprovada:
  - `pytest app/tests/test_ai_router.py app/tests/test_ai_quota.py app/tests/test_ai_quota_repository.py app/tests/test_ai_hardening_task.py app/tests/test_ai_security_redteam.py`
- [ ] Se houver alteração no frontend (`ChatWidget`), sanitização com `DOMPurify`, ocultação para `admin` e tratamento de status `429`/`402` preservados.
