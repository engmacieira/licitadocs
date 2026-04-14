# 🤖 Contexto de Continuidade: LicitaDocs (Cofre Digital)

> **PARA O AGENTE/DESENVOLVEDOR:**
> Este arquivo é o seu Ponto de Restauração. Leia-o antes de iniciar qualquer nova funcionalidade.

## 📍 Estado Atual da Missão
* **Fase do Projeto:** Geração de Valor e Customização.
* **Sprint Atual:** **Sprint 30: Personalização de Documentos (Fase 5 do Roadmap)**.
* **Última Ação Realizada:** Finalização do planejamento da Sprint 29 (Backoffice). Agora o foco é a experiência de geração de documentos do cliente, tornando-a didática e personalizada.
* **PRÓXIMO PASSO IMEDIATO:** Executar o Backlog da Sprint 30, focado em:
  1. **Personalização:** Implementar upload de logo e injeção dinâmica de dados em modelos.
  2. **Formatos:** Garantir exportação para `.doc` (editável) e `.pdf`.
  3. **Didática:** Refatorar a página de modelos com conteúdos explicativos e alertas legais.

## 🏗️ Definições Arquiteturais (Não Quebrar)
* **Arquitetura:** MVC/Repository (Backend) e Orchestrator/Feature (Frontend).
* **Processamento de Documentos:** Utilizar bibliotecas robustas para manipulação de templates (Ex: `python-docx` para DOCX e `ReportLab`/`WeasyPrint` para PDF).
* **Storage:** Logos de empresa devem ser armazenadas de forma isolada e otimizada no S3/Storage.

---
**Atualizado em:** Março de 2024
**Responsável:** Jules (Software Engineer)
