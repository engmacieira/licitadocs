# 🏁 Log de Sprint: 01 - Fundação e Identidade

**Período:** 17/01/2026
**Status:** Concluído
**Objetivo Principal:** Criar a infraestrutura base (Banco de Dados) e o sistema completo de Autenticação (Register/Login).

## 🚀 Entregas Realizadas (O Que)
*Funcionalidades PRONTAS e TESTADAS.*

* **[Infra]** Setup do projeto com arquitetura MVC/Repository e Banco de Dados (SQLAlchemy).
* **[Database]** Modelagem das tabelas `User` e `Company` utilizando UUIDs.
* **[Security]** Implementação de Hash de Senha Seguro (Bcrypt) e Token JWT.
* **[API]** Endpoints de `/auth/register` (Cadastro) e `/auth/login` (OAuth2).
* **[QA]** Pipeline de testes automatizados (`pytest`) para fluxos de sucesso e erro.

## 🛑 O Que Ficou de Fora (Desvios)
* *Nenhum.* Todas as tarefas planejadas no Backlog da Sprint 1 foram entregues.

## 🧠 Retrospectiva (O Como)

### ✅ O que funcionou bem?
* **Mentalidade TDD:** Criar o arquivo de teste antes de corrigir o bug de versão nos salvou tempo.
* **Padrão Gold Standard:** Commits detalhados e "atômicos" deixaram o histórico muito profissional.
* **Separação de Camadas:** A divisão entre `Router` -> `Schema` -> `Repository` facilitou a manutenção.

### ⚠️ O que travou ou atrapalhou?
* **Conflito de Dependências:** Ocorreu um problema de compatibilidade entre `passlib` e `bcrypt 5.0+` (Erro `AttributeError: module 'bcrypt' has no attribute '__about__'`).
* **Configuração de Path:** O `pytest` no Windows teve dificuldade de encontrar o módulo `app`, exigindo a criação do `__init__.py`.

### 🔧 Soluções Aplicadas
* Downgrade estratégico do `bcrypt` para versão 4.0.1.
* Inclusão de `__init__.py` na raiz para reconhecimento de pacote.
* Atualização de sintaxe depreciada do Pydantic V2 (`ConfigDict`).

## 🚧 Débito Técnico Gerado
* A `SECRET_KEY` ainda está hardcoded no código por enquanto (será migrada para variáveis de ambiente reais na próxima etapa).

---
**Assinatura:** Tech Lead & Dev (Matheus e Mark)