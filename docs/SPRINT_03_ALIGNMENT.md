# 🧭 Sprint 03: Alinhamento e Arquitetura (Pivô)

**Objetivo:** Ajustar a rota tecnológica para o modelo de negócio "Concierge" (Onde a equipe interna gere os documentos pelo Cliente).
**Período:** 17/01/2026
**Status:** Em Andamento

---

## 📊 Relatório de Aderência (Gap Analysis)

Análise do que foi construído nas Sprints 1 e 2 versus a nova visão do produto.

### 1. Autenticação e Onboarding
* **O que temos:** Cadastro simples (`/auth/register`) que cria Usuário e Empresa automaticamente e já libera o acesso.
* **O que precisamos (Gap):** O cliente não pode operar assim que cadastra. Ele precisa assinar a **Procuração Digital**.
* **Ação Técnica:** Planejar campo de `status` na Empresa (`PENDING_SIGNATURE` -> `ACTIVE`).

### 2. Permissões (RBAC - Role Based Access Control)
* **O que temos:** Todo usuário é tratado igual (como dono da empresa).
* **O que precisamos (Gap):** Diferenciar dois atores:
    * **ADMIN (Operador):** Pode ver e editar documentos de *todas* as empresas.
    * **CLIENT (Cliente):** Só vê os documentos da *própria* empresa (Read-Only).
* **Ação Técnica:** Adicionar coluna `role` na tabela `users` e refatorar `dependencies.py`.

### 3. Upload de Documentos
* **O que temos:** O endpoint `/documents/upload` assume que o arquivo pertence a quem está enviando.
* **O que precisamos (Gap):** O Admin precisa enviar um arquivo e dizer: *"Este PDF pertence à Empresa X"*.
* **Ação Técnica:** Refatorar o Router de Upload para aceitar um `target_company_id` (apenas se for Admin).

---

## 📅 Backlog da Sprint 03 (Tarefas de Organização)

Nesta sprint, **não escreveremos código de produção** cegamente. Vamos preparar o terreno.

1.  **[Doc]** Oficializar a Visão do Produto em `docs/USER_STORIES.md` (Concluído).
2.  **[Arquitetura]** Desenhar o novo fluxo de permissões (Roles: `ADMIN` vs `CLIENT`).
3.  **[Planejamento]** Mapear exatamente quais arquivos `.py` precisarão de refatoração na Sprint 4.
4.  **[POC - Prova de Conceito]** Escolher e testar a API de Assinatura (ZapSign/ClickSign) apenas via Postman/Curl (sem codar no sistema ainda), para garantir viabilidade técnica.

---

## 📝 Definição de Pronto (Definition of Done)
* [ ] Arquivo `USER_STORIES.md` atualizado e comitado.
* [ ] Documento de Alinhamento (`SPRINT_03_ALIGNMENT.md`) criado.
* [ ] POC de assinatura realizada e validada.
* [ ] Backlog da Sprint 4 (Execução) montado.