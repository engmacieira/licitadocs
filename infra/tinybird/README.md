# 📊 Infraestrutura Analítica: LicitaDocs - Analytics

Esta pasta contém a definição dos **Data Sources** base para o ambiente analítico do LicitaDocs no Tinybird. O objetivo desta arquitetura é absorver a carga de consultas pesadas e telemetria, aliviando o banco de dados PostgreSQL principal.

## 🚀 Como Inicializar o Ambiente

Para criar o workspace e subir os schemas, execute os seguintes comandos no seu terminal local (requer [Tinybird CLI](https://docs.tinybird.co/cli.html) instalado):

### 1. Autenticação e Criação do Workspace
```bash
# Substitua pelo seu Admin Token
export TB_TOKEN="SEU_ADMIN_TOKEN"

# Criar o novo workspace (Região sugerida: us-east)
tb workspace create "LicitaDocs - Analytics" --region us-east4
```

### 2. Implantação dos Data Sources
```bash
cd infra/tinybird/

# Subir os schemas definidos
tb push audit_logs.datasource
tb push ai_usage.datasource
tb push messages.datasource
tb push emission_requests.datasource
```

---

## 🏗️ Mapeamento de Data Sources

| Data Source | Finalidade | Chave de Ordenação (Sorting Key) |
| :--- | :--- | :--- |
| `audit_logs` | Rastreabilidade total de ações no sistema. | `entity_name, created_at` |
| `ai_usage` | Monitoramento de consumo de tokens por empresa/dia. | `company_id, usage_date` |
| `messages` | Telemetria de tickets e volume de comunicação. | `company_id, created_at` |
| `emission_requests` | Monitoramento da fila de emissão e gargalos de robôs. | `company_id, status, created_at` |

---

## 🔍 Oportunidades de Pipes (Próximas Sprints)

Mapeamos as seguintes consultas complexas que deverão ser migradas para o Tinybird para garantir alta performance:

1.  **Market Intelligence (Forensics):**
    *   *Query:* Agrupamento de `audit_logs` para identificar padrões de comportamento de usuários MASTER vs VIEWERS.
    *   *Objetivo:* Entender quais módulos são mais utilizados para priorizar o roadmap de produto.

2.  **Conversion Funnel (Leads):**
    *   *Query:* Join futuro entre dados do PNCP (leads capturados) e o status de `emission_requests`.
    *   *Objetivo:* Visualizar o tempo médio desde a captura de um lead até a primeira certidão emitida com sucesso.

3.  **Financial Safety (AI Quota):**
    *   *Query:* Agregados em tempo real de `ai_usage` por empresa.
    *   *Objetivo:* Alertas proativos de empresas chegando perto do limite de 30.000 tokens diários antes mesmo da falha no backend.

4.  **Operational Bottleneck:**
    *   *Query:* Ranking de `emission_requests` com status 'error' ou 'pending' agrupados por `emission_rule_id` (Geografia).
    *   *Objetivo:* Identificar quais órgãos ou regiões estão apresentando mais falhas técnicas de captura.

---
**Assinatura:** 🤖 AI (Jules) - Software Engineer
