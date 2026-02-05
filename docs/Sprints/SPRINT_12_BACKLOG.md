# 🗺️ Sprint 12: Infraestrutura de Produção e Modelagem de Certidões

**Objetivo:** Migrar o banco de dados para PostgreSQL (Produção), configurar controle de versão de schema com Alembic e estruturar a inteligência de gestão de certidões.
**Status:** Planejamento
**Tecnologia Principal:** FastAPI, SQLAlchemy, Alembic, PostgreSQL

---

## 🎯 Backlog de Funcionalidades (Escopo)

### 📦 1. Infraestrutura e Persistência
* **[US-25] Configuração de Ambiente de Produção (PostgreSQL)**
    * **O que é:** Refatorar a conexão de banco de dados para suportar tanto SQLite (para testes rápidos/local) quanto PostgreSQL (para produção), controlado via variáveis de ambiente.
    * **Critério de Aceite:** O sistema deve iniciar corretamente conectando-se a uma instância PostgreSQL local ou Dockerizada.
    * **Regra de Negócio:** As variáveis `DATABASE_URL` no `.env` devem ditar qual banco será usado.

* **[US-26] Implementação do Alembic (Migrations)**
    * **O que é:** Configurar o Alembic para gerenciar as alterações no schema do banco de dados.
    * **Critério de Aceite:**
        1. Comando `alembic upgrade head` cria todas as tabelas em um banco vazio.
        2. O uso de `Base.metadata.create_all(bind=engine)` deve ser removido ou isolado apenas para ambiente de teste.
    * **Regra de Negócio:** Nenhuma alteração de tabela deve ser feita manualmente no SQL; tudo deve passar por arquivos de revisão do Alembic.

### 📦 2. Gestão de Certidões (Modelagem)
* **[US-27] Entidade Especializada de Certidões**
    * **O que é:** Criar o modelo `Certificate` (que pode herdar ou se relacionar com `Document`).
    * **Campos Necessários:**
        * `document_id` (FK para Documentos)
        * `certificate_type` (Federal, Estadual, Municipal, Trabalhista, etc.)
        * `emission_date` (Data de Emissão)
        * `expiration_date` (Data de Validade)
        * `access_code` (Código de validação online)
        * `issuing_body` (Órgão Emissor - ex: Receita Federal)
    * **Critério de Aceite:** O modelo deve permitir consultas filtrando por "data de validade" para identificar documentos vencidos.

---

## 🛠️ Plano Técnico de Execução

1.  **Setup de Dependências:**
    * Adicionar `alembic` e `psycopg2-binary` (ou `asyncpg` se formos 100% async no futuro) ao `requirements.txt`.
2.  **Inicialização do Alembic:**
    * Rodar `alembic init alembic`.
    * Configurar `alembic.ini` e `alembic/env.py` para ler a `DATABASE_URL` do sistema e importar o `Base` dos models.
3.  **Refatoração do Database Core:**
    * Editar `app/core/database.py` para remover a criação automática de tabelas na inicialização da API (deixar isso para o Alembic).
4.  **Criação do Modelo de Certidão:**
    * Criar `app/models/certificate_model.py`.
    * Garantir os relacionamentos com `Document` e `Company`.
5.  **Geração da Migration Inicial:**
    * Rodar `alembic revision --autogenerate -m "initial_structure_and_certificates"`.
    * Aplicar com `alembic upgrade head`.

---

## 📝 Definição de Pronto (DoD)

* [ ] Arquivo `alembic.ini` e pasta `alembic/` versionados no Git.
* [ ] Conexão com PostgreSQL testada e funcionando.
* [ ] Tabela `certificates` criada no banco de dados via migration.
* [ ] `.env.example` atualizado com exemplos de conexão Postgres.