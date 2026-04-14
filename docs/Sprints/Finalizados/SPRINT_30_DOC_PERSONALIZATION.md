# 🗺️ Sprint 30: Personalização de Documentos (Fase 5)

**Objetivo:** Elevar a qualidade das declarações geradas pelo sistema, permitindo que o cliente emita documentos profissionais, personalizados com sua marca e com clareza sobre as obrigações legais.
**Status:** Planejamento
**Tecnologia Principal:** React, FastAPI, Python-Docx (Backend), ReportLab/WeasyPrint.

---

## 🎯 Backlog da Sprint (User Stories)

### 📦 1. Experiência do Usuário (Didática)
* **[x] [US-3001] Conteúdo Educativo em `/document-templates`:** Adicionar cards explicativos para cada modelo de documento, detalhando sua finalidade e a base legal (Ex: Por que esta declaração é necessária?).
* **[x] [US-3002] Alerta de Responsabilidade Legal:** Implementar modal de confirmação ou aviso fixo sobre as consequências criminais/administrativas de prestar informações falsas em declarações oficiais.

### 📦 2. Personalização Dinâmica
* **[-] [US-3003] Gestão de Marca (Logo):** Criar campo de upload para a Logo da Empresa em `company-settings`. Garantir que esta logo seja redimensionada e armazenada corretamente.
* **[x] [US-3004] Injeção de Dados em Templates:** Automatizar o preenchimento de cabeçalhos e rodapés nos documentos com:
    - Razão Social e CNPJ
    - Endereço Completo
    - Dados do Responsável Legal

### 📦 3. Flexibilidade de Formatos
* **[x] [US-3005] Geração de DOCX Editável:** Implementar motor de renderização para permitir o download de modelos em formato `.doc/.docx`, facilitando ajustes manuais pelo cliente.
* **[x] [US-3006] Geração de PDF Oficial:** Manter a opção de download em PDF para documentos que não requerem edição posterior, com layout otimizado e profissional.

---

## 🛠️ Plano Técnico de Execução

1.  **Backend (Document Engine):** 
    - Integrar `python-docx` para manipulação de arquivos Word.
    - Criar service `DocumentGeneratorService` que recebe o ID da empresa e o tipo de template.
2.  **Frontend (UI):**
    - Refatorar a visualização da lista de templates para um formato de "Catálogo Didático".
    - Adicionar suporte a múltiplos formatos de download no componente de ação.

---

## 📝 Definição de Pronto (DoD)
* [ ] Cliente consegue fazer upload de sua logo e visualizá-la no sistema.
* [ ] Documentos baixados (DOCX/PDF) contêm a logo e os dados corretos da empresa no cabeçalho.
* [ ] Todos os modelos de documentos possuem descrição didática e alerta de responsabilidade.
* [ ] O motor de geração de documentos suporta troca dinâmica de dados sem corromper o arquivo.

---
**Assinatura:** Jules (Software Engineer) & Matheus (Product Owner)
