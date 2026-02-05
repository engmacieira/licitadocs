# 🏁 Log de Sprint: 12 - Infraestrutura de Produção (PostgreSQL & Alembic)

**Período:** 04/02/2026
**Status:** Concluído
**Foco:** Migração do banco de dados para PostgreSQL (Docker) e controle de versão de schema (Alembic).

## 🚀 Entregas Realizadas (O Que)
* **[Infra]** Container Docker PostgreSQL configurado e rodando na porta `5433` (para evitar conflitos).
* **[Backend]** Integração do `FastAPI` com Postgres via driver `psycopg2`.
* **[Banco de Dados]** Setup do **Alembic** realizado.
    * Migration inicial (`create_all_tables_initial`) criada e aplicada com sucesso.
    * Tabela `certificates` (Certidões) criada com relacionamentos.
* **[Segurança]** Refatoração do `database.py` para suportar fallback de conexão.
* **[Scripts]** Script `create_first_admin` validado no novo banco.

## 🧠 Retrospectiva (O Como)

### ✅ O que funcionou bem?
* **Docker:** A decisão de usar Docker salvou o ambiente. Mesmo com conflitos de porta na máquina host, conseguimos isolar o banco novo rapidamente.
* **Alembic:** Uma vez configurado, rodou as migrations perfeitamente, criando a estrutura complexa de tabelas (User, Company, Document, Certificate) automaticamente.

### ⚠️ Lições Aprendidas / Obstáculos
* **Encoding do Windows (Erro 0xe7):** Tivemos um problema crítico onde o Python no Windows não conseguia ler o arquivo `.env` corretamente (caracteres fantasmas/encoding).
    * *Solução:* Implementamos um **Hardcode de Segurança** no `env.py` e `database.py` para garantir a conexão, ignorando temporariamente as variáveis de ambiente bugadas.
* **Conflito de Portas:** A porta padrão `5432` estava ocupada por um projeto fantasma.
    * *Solução:* Mapeamos o container para a porta externa `5433`.

---

## 📊 Status Final
* **Dívidas Técnicas Geradas:** Hardcode de credenciais (database.py e env.py) precisa ser resolvido futuramente.
* **Próximos Passos:** Iniciar o desenvolvimento das telas de Gestão de Certidões (Sprint 13).

---
**Assinatura:** Tech Lead & Dev (Matheus e Mark)