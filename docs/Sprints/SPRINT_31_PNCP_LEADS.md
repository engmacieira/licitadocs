# 🗺️ Sprint 31: Inteligência de Mercado e Leads (Fase 4)

**Objetivo:** Transformar o LicitaDocs em uma ferramenta de prospecção ativa, integrando dados do PNCP para identificar potenciais clientes e gerenciar o funil de vendas administrativo.
**Status:** Planejamento
**Tecnologia Principal:** API PNCP (Gov.br), FastAPI (Backoffice), PostgreSQL.

---

## 🎯 Backlog da Sprint (User Stories)

### 📦 1. Inteligência de Dados (Backoffice)
* **[US-3101] Entidade Lead:** Criar a modelagem `Lead` no banco de dados para armazenar: CNPJ, Razão Social, Telefone, E-mail, Origem (PNCP) e Status de Prospecção.
* **[US-3102] Integração API PNCP:** Desenvolver o crawler/service para consumir dados do Portal Nacional de Contratações Públicas, filtrando empresas cadastradas ou vencedoras de certames recentes.
* **[US-3103] Enriquecimento de Leads:** Implementar lógica para buscar dados de contato adicionais das empresas capturadas via PNCP para facilitar a abordagem comercial.

### 📦 2. CRM Administrativo (Frontend)
* **[US-3104] Painel de Prospecção:** Criar tela `/admin/leads` para visualização e busca de potenciais clientes capturados.
* **[US-3105] Gestão de Funil:** Permitir que o administrador altere o status do lead (Ex: Novo -> Contatado -> Interessado -> Convertido).
* **[US-3106] Conversão de Lead:** Criar funcionalidade para "Converter em Empresa", migrando os dados básicos do Lead para a tabela de Onboarding/Empresas.

### 📦 3. Compliance e Controle
* **[US-3107] Sistema Anti-Spam:** Implementar registro de interações para evitar que a equipe envie mensagens repetitivas para o mesmo lead em curto espaço de tempo.
* **[US-3108] Dashboard de Mensagens:** Criar visualização simples para o Admin monitorar a volumetria de prospecção e garantir conformidade com a LGPD.

---

## 🛠️ Plano Técnico de Execução

1.  **Backend (CRM Engine):** 
    - Criar `app/models/lead_model.py` e `app/repositories/lead_repository.py`.
    - Desenvolver `app/services/pncp_service.py` para integração assíncrona.
2.  **Frontend (UI):**
    - Desenvolver a funcionalidade de filtragem e busca no Painel de Leads.
    - Implementar componentes de badge coloridos para os status do funil de vendas.

---

## 📝 Definição de Pronto (DoD)
* [ ] Sistema captura e armazena automaticamente 50+ leads diários via PNCP.
* [ ] Admin consegue filtrar leads por estado ou data de captura.
* [ ] Histórico de contato registrado para cada lead.
* [ ] A conversão de Lead para Empresa funciona sem perda de dados.

---
**Assinatura:** Jules (Software Engineer) & Matheus (Product Owner)
