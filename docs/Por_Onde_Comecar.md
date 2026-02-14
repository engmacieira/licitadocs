# 🚀 Por Onde Começar (Guia de Contexto)

**Última Atualização:** [Data Atual]
**Sprint Atual:** Sprint 17 - Arquitetura de Dados & Cofre Inteligente
**Status:** 🟡 Iniciando

---

## CONTEXTO IMEDIATO
Acabamos de finalizar a **Sprint 16**, onde refatoramos todo o Frontend para exibir documentos em um formato de "Cofre Digital" (Habilitação Jurídica, Fiscal, Técnica, etc.).

⚠️ **Atenção:** Atualmente, essa categorização é feita por uma "gambiarra" lógica no Frontend (`frontend/src/utils/documentCategorizer.ts`) que adivinha a categoria pelo nome do arquivo.

**O Objetivo da Sprint 17** é mover essa inteligência para o Banco de Dados, criando tabelas estruturadas para suportar automação e validação de documentos.

---

## 📋 PLANO DE AÇÃO (Sprint 17)

O próximo agente deve seguir esta ordem de execução, baseada no arquivo `docs/Sprints/SPRINT_17_BACKLOG.md`:

### 1. Modelagem de Dados (Backend)
- [ ] Criar modelos SQLAlchemy em `app/models/`:
    - `DocumentCategory` (Domínio macro: Jurídico, Fiscal...)
    - `DocumentType` (Catálogo: Contrato Social, CND Federal...)
    - `Certificate` (O documento em si, com validade e metadados JSONB).
- [ ] Gerar a migration do Alembic: `alembic revision --autogenerate -m "create_certificate_structure"`.

### 2. Seeding (Dados Iniciais)
- [ ] Criar script `app/scripts/seed_document_types.py`.
- [ ] Popular o banco com as categorias e tipos padrões de licitação (essencial para o frontend funcionar).

### 3. Integração (Backend <-> Frontend)
- [ ] Atualizar `DocumentRepository` para buscar da nova tabela `certificates` (fazendo merge com a tabela legada `documents` se necessário).
- [ ] Criar rota `GET /document-types` para o frontend popular o dropdown de upload.
- [ ] Atualizar o componente `UploadModal` no Frontend para usar IDs reais em vez de strings.

---

## 📂 ARQUIVOS CHAVE

### Documentação
- `docs/Sprints/SPRINT_17_BACKLOG.md` (📜 **Fonte da Verdade desta Sprint**)
- `docs/DividasTecnicas.md` (Entenda o problema do `documentCategorizer.ts`)

### Código Legado (Para Refatorar/Consultar)
- `frontend/src/utils/documentCategorizer.ts` -> **Deve ser obsoleto ao fim da sprint.**
- `app/models/document_model.py` -> Tabela antiga (será mantida para legado/genéricos).

### Novos Arquivos (Para Criar)
- `app/models/certificate_model.py`
- `app/models/document_category_model.py`

---
