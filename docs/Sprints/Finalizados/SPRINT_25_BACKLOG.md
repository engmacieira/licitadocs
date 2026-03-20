# 🗺️ Sprint 25: Hardening e Documentação (Frontend)

**Objetivo:** Pagar débito técnico, reestruturar o Frontend para uma arquitetura modular baseada em *Features* e padronizar a documentação do código com JSDoc.
**Status:** Planeamento

---

## 🎯 Backlog de Refatoração (Escopo)

* **[US-2501] Isolar o Design System:** * Centralizar todos os componentes genéricos (`Button`, `Input`, `StatsCard`, etc.) numa pasta de UI dedicada, sem qualquer acoplamento com regras de negócio ou serviços da API.

* **[US-2502] Modularizar Gestão de Documentos:** * Mover a inteligência do Cofre (`CompanyVault`, `UploadModal`, componentes auxiliares) para um módulo independente de Documentos.

* **[US-2503] Modularizar Monitores e Dashboards:** * Isolar os componentes complexos do Monitor de Regularidade (`IrregularMonitor`, `ExpiringMonitor`) num módulo próprio.

* **[US-2504] Modularizar IA e Onboarding:** * Transformar o Widget do Chat e os Passos de Configuração do Cliente em módulos separados.

* **[US-2505] Padronização com JSDoc:** * Documentar 100% dos serviços (API) e componentes de interface das novas *features* utilizando o padrão JSDoc, descrevendo os parâmetros e a função de cada um.