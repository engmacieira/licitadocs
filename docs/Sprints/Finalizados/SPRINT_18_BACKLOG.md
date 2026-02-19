# 🗺️ Sprint 18: Gestão Profissional do Catálogo (Settings)

**Objetivo:** Desenvolver o módulo administrativo definitivo para gestão de Categorias e Tipos de Documentos, eliminando qualquer necessidade de manipulação manual do banco de dados.
**Status:** Planejamento 📝
**Tecnologia Principal:** FastAPI (Backend CRUD) / React (Painel Admin)

---

## 🎯 Backlog de Funcionalidades (Escopo)

### 📦 1. Motor de Categorias (Pastas Macro)
* **[US-18.1] CRUD Completo de Categorias**
    * **O que é:** Interface gráfica e API para Criar, Listar, Editar e Excluir categorias (Ex: "Fiscal", "Jurídica").
    * **Critério de Aceite:** O Admin pode alterar o nome, o "slug" (identificador interno) e a ordem de exibição das pastas no Cofre.
    * **Regra de Negócio (Segurança):** Não é permitido excluir uma categoria se ela possuir Tipos de Documentos atrelados a ela (Proteção de Integridade Relacional).

### 📦 2. Motor de Tipos de Documentos (Catálogo Específico)
* **[US-18.2] CRUD Completo de Tipos**
    * **O que é:** Gestão individual de cada certidão exigida (Ex: "CND Federal", "Contrato Social").
    * **Critério de Aceite:** O Admin pode criar um novo documento, definir em qual categoria ele entra, colocar uma descrição/instrução e definir os "Dias de Validade Padrão".
    * **Regra de Negócio (Segurança):** Não é permitido deletar um Tipo de Documento se já existirem PDFs de clientes vinculados a ele. Nesse caso, a interface deve permitir apenas "Inativar" o tipo.

### 📦 3. Interface Administrativa (UI/UX)
* **[US-18.3] Tela de Configurações (`/settings`)**
    * **O que é:** Uma página profissional no painel do Admin, dividida em abas ou listas expansíveis.
    * **Critério de Aceite:** Uso de modais para criação/edição e botões de ação claros com confirmação de exclusão (prevenindo cliques acidentais).

---

## 🛠️ Plano Técnico de Execução

1.  **Backend (Schemas):** Finalizar os DTOs `DocumentTypeCreate`, `DocumentTypeUpdate`, `DocumentCategoryCreate` e `DocumentCategoryUpdate` no arquivo `document_schemas.py`.
2.  **Backend (Repository & Router):** Criar os métodos no Repositório para inserir, atualizar e deletar os dados, com tratamento de erros robusto (`IntegrityError`). Expor as rotas `POST`, `PUT`, `DELETE` em `document_router.py`.
3.  **Frontend (Service):** Adicionar as chamadas de API correspondentes no `documentService.ts`.
4.  **Frontend (UI):** Desenvolver a página `pages/Admin/Settings/index.tsx` contendo a tabela interativa e modais de formulário usando `react-hook-form`.

---

## 📝 Definição de Pronto (DoD)
* [ ] Todo o gerenciamento de documentos (adicionar, editar, remover) pode ser feito 100% pela interface gráfica.
* [ ] O banco de dados está protegido contra exclusões acidentais que deixariam arquivos "órfãos".
* [ ] As alterações feitas no painel de Settings refletem em tempo real no Modal de Upload e no Cofre do Cliente.