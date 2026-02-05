# 🗺️ Sprint 07: Vínculos e Multi-Tenancy (Isolamento de Dados)

**Objetivo:** Implementar o relacionamento entre Usuários e Empresas, garantindo que cada usuário veja apenas os dados da sua organização (Multi-tenancy lógico).
**Status:** Planejado
**Stack:** FastAPI (Migration/Models), React (Select/Combobox).

---

## 🎯 Backlog de Funcionalidades

### 👥 1. Vínculo Usuário-Empresa
* **[US-23] Ajuste de Modelagem (Migration):**
    * Adicionar coluna `company_id` na tabela `users`.
    * Atualizar `user_model.py` para refletir relacionamento N:1 (Muitos usuários para Uma empresa).
* **[US-24] Seleção de Empresa no Cadastro:**
    * (Opcional) No cadastro de usuário (ou criação pelo Admin), permitir selecionar a qual Empresa ele pertence.
    * Criar um `Select` no frontend que busca as empresas da API.

### 🔒 2. Isolamento de Dados (O Core do SaaS)
* **[US-25] Middleware de Contexto:**
    * Garantir que, ao fazer login, o sistema saiba qual é o `company_id` do usuário.
* **[US-26] Filtragem de Documentos:**
    * Alterar `GET /documents` para retornar apenas documentos `WHERE company_id == current_user.company_id`.
    * Atualmente retorna tudo (o que é uma falha de segurança em multi-inquilino).

### 🔧 3. Refinamentos Técnicos (Dívidas)
* **[DT-02] Centralização de API:**
    * Remover todas as URLs `http://127.0.0.1:8000` espalhadas pelos services.
    * Configurar `axios` instance única no `api.ts`.

---

## 📝 Definição de Pronto (DoD)
* [ ] Tabela `users` possui coluna `company_id`.
* [ ] Ao criar um usuário, posso vinculá-lo a uma empresa existente.
* [ ] Usuário da "Empresa A" NÃO vê documentos da "Empresa B".
* [ ] Upload de documento salva automaticamente o ID da empresa do usuário logado.