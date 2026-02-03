# 💸 Dívidas Técnicas e Melhorias Futuras

Este documento lista pontos de melhoria técnica que foram postergados conscientemente para manter a agilidade da entrega do MVP.

---

## 🚨 Prioridade Crítica (Necessário para Produção)

### 1. [Segurança] SECRET_KEY Hardcoded
* **Problema:** O arquivo `app/core/security.py` tem um valor padrão (`"troque_isso_..."`) se a variável de ambiente não existir.
* **Risco:** Se subirmos para produção esquecendo de configurar o `.env`, o sistema fica vulnerável.
* **Ação:** Implementar uma verificação que **impede** o servidor de subir em ambiente `PROD` se a chave for a padrão.

### 2. [Banco] Migrations com Alembic
* **Problema:** Usamos `Base.metadata.create_all` no `main.py`. Qualquer alteração de tabela exige apagar o banco.
* **Ação:** Configurar **Alembic** para versionar o schema.

### 3. [Segurança] Route Guards (Frontend)
* **Problema:** Um usuário "Cliente" pode acessar rotas visuais de "/admin" se digitar a URL direto (embora a API bloqueie os dados).
* **Ação:** Criar componente `<PrivateRoute role="admin" />` no React.

---

## 🎨 Frontend & UX (Foco da Sprint 11)

### 4. [UX] Feedback Visual (Toasts)
* **Problema:** Usamos `alert()` ou `console.log` para erros e sucessos.
* **Ação:** Implementar biblioteca de Toasts (ex: **Sonner**) para avisos elegantes.

### 5. [UX] Loading States
* **Problema:** Tabelas ficam vazias ou piscam enquanto a API carrega.
* **Ação:** Adicionar "Skeletons" (esqueletos de carregamento).

---

## ✅ Dívidas Pagas (Histórico)
* ~~[Refatoração] API Hardcoded no Frontend~~ (Resolvido na Sprint 10 com `api.ts`).
* ~~[Refatoração] Lógica de IA solta no Router~~ (Resolvido na Sprint 10 com `AIService`).
* ~~[Doc] Falta de Swagger/Docstrings~~ (Resolvido na Sprint 10).