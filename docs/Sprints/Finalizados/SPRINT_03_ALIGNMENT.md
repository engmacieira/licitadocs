# 🧭 Sprint 03: Hierarquia e Permissões (Admin Mode)

**Objetivo:** Adaptar o sistema para que o **Administrador** possa gerenciar documentos em nome dos Clientes (Modelo Concierge), sem depender de integrações externas de assinatura ou governo neste MVP.
**Período:** 17/01/2026
**Status:** Planejamento

---

## 📊 Decisões Estratégicas (MVP)
1.  **Assinatura Off-Platform:** A coleta da procuração será feita via e-mail/manual. O sistema apenas receberá o status "Ativo" quando o Admin confirmar.
2.  **Busca Manual:** A consulta de certidões será feita manualmente pela equipe interna. O sistema serve como repositório centralizado e inteligência (IA).
3.  **Foco Técnico:** A prioridade total é permitir que um usuário `ADMIN` manipule dados de uma `COMPANY` que não é dele.

---

## 🗺️ Gap Analysis (O que falta para o Admin trabalhar?)

### 1. Sistema de Roles (Cargos)
* **Atual:** Todo usuário é igual.
* **Necessário:** Criar campo `role` na tabela `users`.
    * `admin`: Acesso total (pode postar em qualquer empresa).
    * `client`: Acesso restrito (só vê sua própria empresa).

### 2. Refatoração do Upload (O "Upload por Terceiros")
* **Atual:** O endpoint pega a empresa do usuário logado (`current_user.company_id`).
* **Necessário:** O endpoint deve aceitar um campo opcional `target_company_id`.
    * Se for `client`: Ignora o campo e usa a própria empresa.
    * Se for `admin`: Usa o `target_company_id` informado.

### 3. Listagem Administrativa
* **Atual:** Só lista meus documentos.
* **Necessário:** Endpoint `GET /admin/companies` para listar todos os clientes e poder entrar no "perfil" deles.

---

## 📅 Backlog da Sprint 03 (Tarefas Técnicas)

### 1. Banco de Dados e Models
* [ ] Adicionar coluna `role` (Enum) na tabela `users` (Default: 'client').
* [ ] Criar Migration (ou recriar banco) para aplicar mudança.

### 2. Lógica de Acesso (Dependencies)
* [ ] Criar verificador `get_current_active_admin` em `dependencies.py` para proteger rotas administrativas.

### 3. Funcionalidades do Admin
* [ ] Refatorar `POST /documents/upload` para suportar upload em nome de terceiros.
* [ ] Criar `GET /admin/companies` (Listar clientes para o Admin selecionar).

---

## 📝 Definição de Pronto (Definition of Done)
* [ ] Admin consegue logar.
* [ ] Admin consegue listar todas as empresas cadastradas.
* [ ] Admin consegue fazer upload de um PDF vinculando-o à Empresa do Cliente X.
* [ ] Cliente X loga e vê o arquivo que o Admin subiu.
* [ ] Cliente Y loga e **não** vê o arquivo do Cliente X.