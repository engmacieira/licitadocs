# Sprint 17: Arquitetura de Dados & Cofre Inteligente

**Período:** [Data Inicial] a [Data Final]
**Status:** Planejada 📝
**Objetivo:** Implementar a estrutura de banco de dados definitiva para suportar a automação de certidões, garantindo performance, integridade de dados e preparação para o módulo de Scrapers (Robôs).

---

## CONTEXTO ESTRATÉGICO
Atualmente, o sistema utiliza uma tabela única `documents` e uma lógica de categorização "hardcoded" no Frontend (Sprint 16). Para escalar e permitir que robôs alimentem a plataforma automaticamente, precisamos de:
1.  **Tipagem Forte:** Saber exatamente o que é uma "CND Federal" vs "Balanço Patrimonial".
2.  **Metadados Específicos:** Armazenar códigos de controle, protocolos e hashes de validação que variam por documento.
3.  **Performance:** Índices otimizados para consultas de "Vencimento Próximo" e "Status de Compliance".

---

## 🏗️ ARQUITETURA DE DADOS PROPOSTA

A tabela `documents` antiga permanecerá para uploads manuais genéricos/legados, mas o "Cofre" passará a ser alimentado principalmente pelas novas tabelas:

### 1. `document_categories` (Domínio)
Categorias macro do cofre.
- `id`: UUID
- `name`: string (Ex: "Habilitação Jurídica", "Regularidade Fiscal")
- `slug`: string (unique, para uso no código ex: `juridica`, `fiscal`)
- `order`: int (para ordenação visual)

### 2. `document_types` (Catálogo)
Tipos específicos de documentos suportados pela plataforma.
- `id`: UUID
- `category_id`: FK -> document_categories
- `name`: string (Ex: "Certidão Negativa Federal", "Contrato Social")
- `slug`: string (unique, ex: `cnd_federal`)
- `validity_days_default`: int (Validade padrão sugerida, ex: 180)
- `description`: text (Instruções para o usuário)

### 3. `certificates` (Tabela Core)
A tabela "pesada" onde ficarão os registros das certidões.
- `id`: UUID
- `company_id`: FK -> companies (Indexed)
- `type_id`: FK -> document_types (Indexed)
- `file_path`: string (Caminho no Storage/S3)
- `filename`: string
- `issue_date`: date (Data de emissão)
- `expiration_date`: date (Data de validade - Indexed para Jobs de Alerta)
- `status`: enum (`valid`, `expired`, `warning`, `processing`, `error`)
- `metadata`: JSONB (Campo flexível para dados específicos)
    - *Ex: { "control_code": "X78-99", "protocol": "123456", "verification_url": "..." }*
- `created_at`: datetime
- `updated_at`: datetime

---

## 📋 BACKLOG DE TAREFAS

### 🛠️ Backend & Database (Prioridade Alta)

#### [BE-01] Modelagem e Migrations (SQLAlchemy)
- Criar modelos `DocumentCategory`, `DocumentType`, `Certificate`.
- Criar script de migration (Alembic) para gerar as tabelas.
- Criar índices: `ix_certificates_company_id`, `ix_certificates_expiration_date`, `ix_certificates_status`.

#### [BE-02] Seeding de Dados (Catálogo)
- Criar script `seed_document_types.py` para popular o banco com a estrutura padrão de licitação:
    - **Jurídica:** Contrato Social, Cartão CNPJ.
    - **Fiscal:** CND Federal, CND Estadual, CND Municipal, FGTS, Trabalhista.
    - **Econômica:** Balanço, Falência.
    - **Técnica:** Atestados.

#### [BE-03] Services e Repositories (Certificate Core)
- Implementar `CertificateRepository` com métodos:
    - `get_valid_by_company(company_id)`
    - `get_expiring_soon(days=10)`
    - `create_or_update(data)` (Upsert lógico para automação)
- Atualizar `DocumentService` para unificar a busca (Merge da tabela antiga `documents` + nova `certificates`) e entregar um DTO único para o Frontend.

#### [BE-04] Rota de Upload Estruturado
- Criar endpoint `POST /certificates/upload` que exige `type_id` além do arquivo.
- Validar se o arquivo corresponde ao tipo (ex: validar extensão).

---

### 🖥️ Frontend (Adaptação)

#### [FE-01] Integração com Tipos Dinâmicos
- Substituir o arquivo `documentCategorizer.ts` (lógica hardcoded).
- Criar hook/contexto para buscar os Tipos e Categorias do banco (`GET /document-types`).
- Atualizar o componente `UploadModal` para listar as categorias vindas do banco no dropdown.

#### [FE-02] Atualização do `CompanyVault`
- Adaptar o componente visual para renderizar os grupos baseados no ID da categoria, não mais na string do nome.
- Exibir metadados extras (ex: "Código de Controle") se disponíveis no JSON do certificado.

---

## 🧪 Critérios de Aceite (DoD)
1.  As tabelas novas existem no banco de dados.
2.  O banco está populado com as categorias e tipos padrão de licitação.
3.  É possível fazer upload de uma certidão especificando seu Tipo (ex: FGTS).
4.  O "Cofre" exibe tanto os documentos antigos (legados) quanto os novos certificados estruturados.
5.  A performance de leitura do Cofre permanece abaixo de 200ms.

## ⚠️ Riscos & Dependências
- **Migração:** Documentos antigos na tabela `documents` não terão categoria definida.
    - *Mitigação:* Nesta sprint, eles serão exibidos na categoria "Outros / Legado" ou tentaremos classificá-los via script auxiliar, mas o foco é a estrutura nova.