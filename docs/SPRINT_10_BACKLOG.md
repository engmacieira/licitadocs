# 📋 Backlog da Sprint 10: Engenharia, Refatoração & Documentação

**Objetivo:** Elevar o padrão do código (Clean Code), unificar nomenclaturas e documentar tecnicamente o ecossistema LicitaDoc para facilitar a escalabilidade.

---

## 🏗️ Épico 1: Refatoração & Padronização
- [ ] **Task 10.1: Flexibilização de Entrada (Aceitar CamelCase) e Documentação Swagger**
  - Aplicar `Field(serialization_alias="...")` nos Schemas para que o Frontend receba `camelCase` enquanto o Python mantém `snake_case`.
- [ ] **Task 10.2: Centralização de Configurações do Frontend**
  - Mover a URL base da API (`http://127.0.0.1:8000`) de dentro dos componentes para um arquivo `.env` ou `config.ts`.
- [ ] **Task 10.3: Limpeza de Código Morto**
  - Remover `app/services/ai_service.py` (se a lógica estiver duplicada no router) e arquivos de testes temporários.

## 📄 Épico 2: Documentação Técnica (Swagger & Docstrings)
- [ ] **Task 10.4: Documentação Exaustiva de Schemas**
  - Adicionar `description` e `example` em todos os campos do Pydantic (User, Document, Company).
- [ ] **Task 10.5: Enriquecimento do Swagger UI**
  - Adicionar `summary`, `response_description` e tags detalhadas em todos os Routers do FastAPI.
- [ ] **Task 10.6: Guia de Arquitetura**
  - Criar um pequeno `ARCHITECTURE.md` explicando o fluxo: Model -> Repository -> Router.

## 🧪 Épico 3: Manutenção de Testes
- [ ] **Task 10.7: Atualização dos Mocks**
  - Garantir que os testes reflitam as novas mudanças de nomenclatura da Sprint 09.