# 💸 Dívidas Técnicas e Melhorias Futuras

Este documento rastreia débitos técnicos conscientes e pontos de melhoria para garantir a evolução saudável do LicitaDoc.

---

## 🚨 Prioridade Crítica (Backend & Infra)

Estes itens representam riscos de segurança ou operação e devem ser priorizados antes do Go-Live oficial.

### 1. [Segurança] SECRET_KEY Hardcoded
* **Problema:** O arquivo `app/core/security.py` possui um valor padrão inseguro caso a variável de ambiente falhe.
* **Risco:** Vulnerabilidade crítica em produção se o `.env` não for carregado corretamente.
* **Ação:** Implementar check no `main.py` que impede a inicialização do servidor em ambiente `PROD` se a chave for a padrão.

### 2. [Banco] Migrations com Alembic
* **Problema:** Atualmente usamos `Base.metadata.create_all`. Qualquer alteração de coluna exige dropar o banco inteiro.
* **Risco:** Impossível manter dados persistentes ao evoluir o schema.
* **Ação:** Configurar **Alembic** para versionamento de schema e migrações seguras.

### 3. [Segurança] Route Guards por Role (Frontend)
* **Problema:** O componente `ProtectedRoute` verifica apenas se o usuário está logado. Um usuário "Cliente" tecnicamente consegue acessar a rota `/admin/dashboard` se digitar na URL (embora a API bloqueie os dados, a tela carrega).
* **Ação:** Criar componente `<RoleRoute role="admin" />` para redirecionar usuários sem permissão para o dashboard correto.

---

## 🧪 Qualidade & Testes

### 4. [QA] Testes End-to-End (E2E)
* **Problema:** Temos testes unitários no Backend, mas o fluxo visual (Login -> Dashboard -> Upload) não é testado automaticamente.
* **Ação:** Configurar **Cypress** ou **Playwright** para garantir que o fluxo crítico do usuário não quebre em refatorações de UI.


## 🔒 Segurança e Infra
* **[Infra]** Hardcode de credenciais do Banco de Dados no código (env.py e database.py).
    * *Motivo:* Problemas de encoding (cp1252/utf-8) no Windows impediram leitura limpa do .env.
    * *Ação Futura:* Investigar configuração do Python/OS para carregar variáveis de ambiente corretamente e remover as strings de conexão do código fonte.

---

## ✅ Dívidas Pagas (Histórico Recente)

> Itens resolvidos nas últimas Sprints.

### ~~[UX] Feedback Visual (Toasts)~~ (Pago na Sprint 11)
* **Solução:** Implementada biblioteca `sonner`. Agora erros de API (401, 500) e sucessos de operação são notificados via Toasts elegantes, eliminando `alert()` e `console.log`.

### ~~[UX] Loading States~~ (Pago na Sprint 11)
* **Solução:** Criados componentes de **Skeleton** para Tabelas, Cards e Chat. A interface não "pisca" mais branco enquanto carrega dados.

### ~~[Frontend] Limpeza de Código Legado~~ (Pago na Sprint 11)
* **Solução:** A estrutura antiga de páginas de Chat (`src/pages/AIChat`) foi removida em favor do **ChatWidget Global**, centralizando a lógica de IA no `MainLayout`.

### ~~[Frontend] Centralização de Serviços~~ (Pago na Sprint 10)
* **Solução:** Toda chamada `axios` direta foi removida das páginas e encapsulada em `src/services/`, facilitando a manutenção e tratamento de erros global.