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