# 📋 Backlog da Sprint 08: Operação Concierge & IA Contextual

**Objetivo Estratégico:** Separar a visão do Cliente (Consumo) da visão do Admin (Operação) e especializar a IA.
**Foco:** Frontend (UX Admin) e RAG (Retrieval Augmented Generation).

---

## 🚀 Épico 1: A Interface da Operação (Admin)
*Onde a equipe LicitaDoc trabalha.*

### [TASK-01] Painel de Gestão de Clientes (Frontend)
* **O que é:** Dashboard exclusivo para usuários `role: admin`.
* **Funcionalidade:**
    * Listar todas as empresas cadastradas no sistema.
    * Exibir status rápido.
    * Ação: Botão "Acessar Cofre" (Gerenciar Documentos).
* **Status:** Backend Pronto (`admin_router.py`). Falta Frontend.

### [TASK-02] Upload Administrativo (Frontend)
* **O que é:** O formulário de upload "Master".
* **Diferencial:**
    * Dropdown para selecionar a **Empresa Alvo** (Target Company).
    * Campo de **Data de Vencimento** (Obrigatório).
    * Campo de **Categoria** (Federal, Estadual, Trabalhista).

---

## 👁️ Épico 2: A Vitrine do Cliente (Read-Only)
*Onde o cliente sente segurança.*

### [TASK-03] Dashboard "Meu Cofre" (Refatoração)
* **O que é:** A Home do Cliente.
* **Mudanças:** Remover upload/delete. Adicionar badges de status.

### [TASK-04] Redirecionamento de Login
* **Regra:**
    * Admin -> `/admin/dashboard`
    * Client -> `/app/my-documents`

---

## 🤖 Épico 3: Inteligência Contextual
*O Consultor Jurídico.*

### [TASK-05] Chat com Contexto (RAG)
* **O que é:** Chat especializado por documento.
* **Técnico:** Endpoint `/ai/chat` recebendo `document_id`.

### [TASK-06] Atualização Lib Google
* **Ação:** Migrar `google.generativeai` -> `google.genai`.

---