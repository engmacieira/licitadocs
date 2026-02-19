# 🗺️ Sprint 06: Gestão Corporativa e Refinamento

**Objetivo:** Implementar o módulo administrativo de **Gestão de Empresas** (CRUD) e refinar o upload de documentos com metadados reais (Validade/Categoria).
**Status:** Planejamento
**Stack:** React (Hook Form + Zod) + FastAPI (SQLAlchemy Relacionamentos).

---

## 🎯 Backlog de Funcionalidades

### 🏢 1. Gestão de Empresas (Admin)
* **[US-19] Listagem de Empresas:**
    * Criar tela `Admin/Companies` para listar todas as empresas cadastradas.
    * Exibir colunas: Nome, CNPJ, Status (Ativo/Inativo), Ações.
* **[US-20] Cadastro/Edição de Empresa:**
    * Criar formulário para adicionar nova empresa (Razão Social, CNPJ).
    * Validar CNPJ (máscara e formato).
    * Endpoint Backend: `POST /admin/companies` e `PUT /admin/companies/{id}`.

### 📄 2. Refinamento de Documentos
* **[US-21] Upload com Metadados:**
    * Melhorar o modal de upload para pedir: "Data de Validade" e "Tipo de Documento".
    * Ajustar o Backend para salvar esses dados no banco.
* **[US-22] Status de Vencimento:**
    * Frontend deve destacar documentos vencidos (vermelho) ou próximos do vencimento (amarelo) na tabela.

### 🔧 3. Dívida Técnica (Pagamento)
* **[DT-01] Remoção de Hardcoded IP:**
    * Remover `http://127.0.0.1:8000` do `documentService.ts`.
    * Configurar corretamente o `VITE_API_URL` e resolver o problema de Proxy definitivamente.

---

## 🛠️ Plano Técnico de Execução

1.  **Backend:**
    * Revisar `company_repository.py`.
    * Criar rotas em `admin_router.py` para CRUD de empresas.
2.  **Frontend (Forms):**
    * Instalar `react-hook-form` e `zod` (para validação profissional).
    * Criar `companyService.ts`.
3.  **Frontend (Pages):**
    * Criar pasta `src/pages/Admin/Companies`.

---

## 📝 Definição de Pronto (DoD)
* [ ] Admin consegue criar uma empresa "Construtora XYZ".
* [ ] Admin vê a lista de empresas.
* [ ] Ao fazer upload de um documento, é obrigatório informar a data de validade.
* [ ] Documentos vencidos aparecem com ícone de alerta na lista.