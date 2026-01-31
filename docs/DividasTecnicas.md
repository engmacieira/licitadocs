# 💸 Dívidas Técnicas e Melhorias Futuras

Este documento lista pontos de melhoria identificados durante o desenvolvimento que foram postergados para manter a agilidade da entrega.

## 🚨 Prioridade Alta (Resolver na Sprint 07 ou 08)
* **[Frontend] URL Hardcoded (CRÍTICO):** * Os arquivos `companyService.ts`, `documentService.ts` e `aiService.ts` estão usando `http://127.0.0.1:8000` fixo.
    * **Impacto:** O sistema não funcionará em Docker, Celular ou Produção.
    * **Ação:** Centralizar a `baseURL` no arquivo `api.ts` usando variáveis de ambiente (`import.meta.env.VITE_API_URL`).
* **[Backend] Mapeamento Manual de Colunas:**
    * No `company_repository.py`, estamos mapeando manualmente `name` (JSON) para `razao_social` (Banco).
    * **Ação:** Padronizar os nomes ou usar `aliases` do Pydantic/SQLAlchemy de forma mais automática para evitar erros futuros.

## 🎨 Frontend & UX
* **Feedback de Usuário:** Ainda usamos `alert()` e `window.confirm()`. Substituir por componentes de **Toast** (Sonner/React Hot Toast) e **Dialogs** (Radix UI/Shadcn) para uma experiência profissional.
* **Validação Visual:** Mostrar mensagens de erro de campo (Zod) diretamente abaixo do input (já feito parcialmente no Modal de Empresas, mas falta expandir para Login e Upload).

## ⚙️ Backend & Dados
* **Modelagem de Usuários x Empresas:**
    * Atualmente o modelo sugere que um Usuário é "Dono" de uma Empresa (`owner_id` na tabela `companies`).
    * **Necessidade:** Precisamos permitir que *vários* usuários pertençam a uma mesma empresa (coluna `company_id` na tabela `users`).
* **Soft Delete:** A exclusão de empresas é definitiva (Hard Delete). Implementar coluna `deleted_at` para segurança jurídica.

## 🔒 Segurança
* **Rate Limiting:** Proteger rotas de login contra força bruta.
* **Refresh Token:** Implementar fluxo de renovação de sessão sem deslogar o usuário.

## 🚨 Prioridade Alta (Sprint 08)
* **[Testes] Warning Google GenAI:**
    * A lib `google.generativeai` foi descontinuada. Os testes estão gerando `FutureWarning`.
    * **Ação:** Migrar para a nova lib `google.genai` ou atualizar a integração no `ai_client.py`.
* **[Banco] Sistema de Migração:**
    * Atualmente precisamos deletar o `licita_doc.db` a cada mudança de tabela.
    * **Ação:** Configurar **Alembic** para gerenciar migrações de esquema sem perder dados.

## 🎨 Frontend & UX
* **Feedback de Usuário:** Ainda usamos `alert()` e `console.log`. Substituir por componentes de **Toast** (Sonner) e **Dialogs** para mensagens de erro/sucesso.
* **Validação Visual:** Mostrar mensagens de erro do Zod diretamente abaixo dos inputs no Login e Upload.

## ⚙️ Backend & Dados
* **[Backend] Mapeamento Manual de Colunas:**
    * No `company_repository.py`, ainda mapeamos manualmente `name` -> `razao_social`. Padronizar usando Pydantic Aliases.
* **Soft Delete:** Implementar coluna `deleted_at` em vez de apagar registros fisicamente.


## 🚨 Prioridade Alta (Sprint 08)
1.  **[Lib IA] Depreciação Google GenAI:**
    * **Problema:** A lib atual `google.generativeai` exibe warnings de fim de suporte.
    * **Ação:** Migrar para `google.genai` ou atualizar a integração no `ai_client.py`.
2.  **[Banco] Migrations:**
    * **Problema:** Ainda deletamos o banco físico a cada mudança de schema.
    * **Ação:** Configurar **Alembic**.

## 🎨 Frontend & UX
1.  **Feedback Visual:** Implementar Toasts (Sonner) para substituir `alert()` e erros silenciosos.
2.  **Dashboard Cliente:** Criar a tela "Read-Only" onde o cliente vê o status das certidões (Verde/Vermelho).

## ⚙️ Backend
1.  **Refatoração de Upload:** O endpoint de upload atual funciona, mas precisa ser restrito para que *apenas Admins* possam enviar arquivos para *outras empresas* (Base do modelo Concierge).