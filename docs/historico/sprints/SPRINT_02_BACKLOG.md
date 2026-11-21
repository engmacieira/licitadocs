# 🚀 Backlog da Sprint 02: O Coração (Gestão de Documentos)

**Objetivo da Sprint:** Implementar o sistema de upload, armazenamento e gestão de validade de documentos (PDFs). Ao final desta sprint, a empresa deverá conseguir enviar um arquivo e saber quando ele vence.

**Status:** Planejamento
**Prioridade:** Alta

---

## 🛠️ Histórias de Usuário (User Stories)

1.  **[US-01] Upload de Documentos**
    * *Como* empresa, *quero* enviar arquivos PDF dos meus documentos (ex: Certidão Negativa), *para* que fiquem salvos e acessíveis na nuvem.
    * **Critérios de Aceite:**
        * Aceitar apenas arquivos PDF.
        * Validar tamanho máximo (ex: 5MB).
        * Salvar arquivo com nome único (UUID) para evitar sobrescrita.

2.  **[US-02] Cadastro de Metadados (Vencimento)**
    * *Como* sistema, *quero* saber a data de validade de cada documento enviado, *para* poder avisar o usuário antes que vença.
    * **Critérios de Aceite:**
        * No upload, receber a data de validade (`expiration_date`).
        * Calcular automaticamente o status (Válido, Vencendo, Vencido).

3.  **[US-03] Listagem da Carteira**
    * *Como* empresa, *quero* ver uma lista de todos os meus documentos enviados, *para* ter controle do que está em dia.
    * **Critérios de Aceite:**
        * Endpoint que retorna JSON com lista de docs da empresa logada.
        * Campos: Nome original, Data de Upload, Validade, Status.

---

## 🔧 Tarefas Técnicas (Backlog Dev)

### 1. Modelagem e Banco de Dados
* [ ] Criar tabela `documents` no banco de dados.
    * Campos: `id` (UUID), `company_id` (FK), `filename` (nome original), `file_path` (onde salvou), `expiration_date` (Date), `status` (Enum/Calculado), `created_at`.
* [ ] Criar relacionamento `Company` -> `Documents` (One-to-Many).

### 2. Infraestrutura de Armazenamento (Storage)
* [ ] Criar módulo `app/core/storage.py`.
    * Inicialmente: Salvar em pasta local (`/storage` ou `/uploads`).
    * Abstração: Criar função genérica `save_file(file)` para facilitar migração futura para AWS S3.

### 3. API e Lógica (Controller/Service)
* [ ] Criar Schema `DocumentCreate` (com validação de data).
* [ ] Criar endpoint `POST /documents/upload`.
    * Receber `UploadFile` (FastAPI) + metadados.
* [ ] Criar endpoint `GET /documents`.
    * Filtrar apenas documentos da empresa do usuário logado (Segurança).

### 4. Qualidade e Testes
* [ ] Teste de Upload (Mockando o sistema de arquivos para não encher o disco).
* [ ] Teste de Validação (Tentar subir .exe ou arquivo gigante).
* [ ] Teste de Isolamento (Empresa A não pode ver documentos da Empresa B).

---

## 📅 Definição de Pronto (Definition of Done)
* [ ] Tabela criada no banco.
* [ ] Upload salvando o arquivo na pasta correta.
* [ ] API retornando a lista de arquivos JSON.
* [ ] Testes automatizados passando.