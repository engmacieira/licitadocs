# 💸 Dívidas Técnicas e Melhorias Futuras

Este documento lista pontos de melhoria técnica que foram postergados conscientemente para manter a agilidade da entrega do MVP.

---

## 🚨 Prioridade Crítica (Sprint 09 - Necessário para Produção)

### 1. [Banco] Migrations com Alembic
* **Problema:** Atualmente, qualquer mudança na estrutura do banco exige deletar o arquivo `licita_doc.db` e perder todos os dados.
* **Impacto:** Impossível ir para produção assim. Se precisarmos adicionar uma coluna "Telefone" no futuro, perderíamos todos os clientes.
* **Ação:** Configurar **Alembic** para versionar o schema do banco de dados.

### 2. [Segurança] Route Guards (Frontend)
* **Problema:** Fizemos o redirecionamento no Login, mas se um Cliente digitar `http://.../admin/dashboard` na barra de endereços, ele pode acabar acessando a tela (mesmo que a API bloqueie os dados, a tela carrega).
* **Ação:** Criar componente `<PrivateRoute role="admin" />` no React para bloquear totalmente o acesso às rotas.

---

## 🤖 Inteligência Artificial & Scalabilidade

### 3. [IA] Limite de Contexto (Token Limit)
* **Problema:** O "Bibliotecário" atual injeta a lista de *todos* os documentos no prompt do sistema. Se o cliente tiver 200 documentos, o prompt vai estourar o limite de tokens ou ficar caro.
* **Ação (Futuro):** Implementar **RAG Real** (Vector Database) ou filtrar apenas os documentos mais recentes/relevantes antes de mandar para o Gemini.

### 4. [IA] Histórico de Chat
* **Problema:** O chat é volátil. Se o cliente der F5, perde a conversa.
* **Ação:** Salvar o histórico de mensagens no banco de dados (`chat_messages` table).

---

## 🎨 Frontend & UX

### 5. [UX] Feedback Visual (Toasts)
* **Problema:** Ainda usamos `alert()` no Upload do Admin e no Chat. É funcional, mas feio.
* **Ação:** Implementar biblioteca de Toasts (ex: **Sonner** ou **React Hot Toast**) para avisos bonitos ("Documento enviado com sucesso!" em verde no canto da tela).

### 6. [UX] Loading States
* **Problema:** Em conexões lentas, o Dashboard pode parecer travado enquanto carrega a lista.
* **Ação:** Adicionar "Skeletons" (esqueletos de carregamento) na tabela de documentos.

---

## ⚙️ Backend & Dados

### 7. [Dados] Soft Delete
* **Problema:** Quando deletamos uma empresa (se implementarmos isso), o dado some para sempre.
* **Ação:** Adicionar coluna `deleted_at` em todas as tabelas críticas. O sistema deve filtrar `WHERE deleted_at IS NULL`.

### 8. [Testes] Cobertura do Concierge
* **Problema:** Criamos lógicas complexas de permissão (Admin pode subir pra outros) e IA, mas não criamos testes automatizados para isso.
* **Ação:** Criar testes unitários para `ai_router.py` e para a nova lógica de `document_router.py`.