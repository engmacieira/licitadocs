# 📋 Backlog da Sprint 09: Confiabilidade, QA & DevOps

**Objetivo Estratégico:** Garantir a estabilidade do MVP Concierge antes de escalar novas funcionalidades. Focar em testes automatizados e esteira de CI/CD.
**Meta de Qualidade:** Alcançar cobertura mínima de 80% no Backend e iniciar cultura de testes no Frontend.

---

## 🛡️ Épico 1: Blindagem do Backend (Python/Pytest)
*Foco: Garantir que as regras de negócio do "Concierge" não quebrem.*

### [TASK-01] Setup e Diagnóstico de Cobertura
* **O que é:** Instalar ferramentas de coverage e mapear onde estamos cegos.
* **Critérios de Aceite:**
    * [ ] Instalar `pytest-cov`.
    * [ ] Configurar `pytest.ini` para rodar coverage por padrão.
    * [ ] Gerar relatório inicial (`term-missing`) identificando módulos críticos sem testes.

### [TASK-02] Fix de Testes Quebrados (Regressão)
* **O que é:** Os testes antigos falham porque mudamos o banco (`expiration_date`, `company_id`). Precisamos atualizá-los.
* **Critérios de Aceite:**
    * [ ] Atualizar `conftest.py` para criar empresas e admins nos fixtures.
    * [ ] Corrigir testes de `auth` e `upload` para incluir os novos campos obrigatórios.
    * [ ] Resultado: `pytest` deve rodar 100% verde (mesmo que com poucos testes).

### [TASK-03] Testes do Modelo Concierge (Security)
* **O que é:** Testar a lógica principal: "Admin pode subir pra todos, Cliente só pra ele".
* **Cenários de Teste:**
    * [ ] `test_admin_can_upload_to_any_company`: Admin envia arquivo com `target_company_id`.
    * [ ] `test_client_cannot_upload_to_others`: Cliente tenta enviar com `target_company_id` e recebe 403.
    * [ ] `test_upload_with_expiration`: Verificar se `expiration_date` é salvo corretamente no banco.

### [TASK-04] Mock da Inteligência Artificial
* **O que é:** Testar o endpoint `/ai/chat` sem gastar dinheiro real com a API do Google.
* **Técnico:**
    * [ ] Criar Mock para `AIClient.generate_chat_response`.
    * [ ] Testar se o endpoint devolve 500 quando a IA falha (tratamento de erro).
    * [ ] Testar se o prompt de sistema está recebendo a lista de documentos corretamente.

---

## 🧪 Épico 2: Início dos Testes Frontend (React/Vitest)
*Foco: Garantir que a interface do cliente não trave.*

### [TASK-05] Setup do Ambiente de Testes
* **O que é:** Configurar Vitest (mais rápido que Jest) no Vite.
* **Critérios de Aceite:**
    * [ ] Instalar `vitest`, `jsdom` e `@testing-library/react`.
    * [ ] Configurar script `npm run test`.

### [TASK-06] Testes Unitários de Componentes
* **O que é:** Testar componentes isolados que têm lógica visual importante.
* **Alvos:**
    * [ ] `StatsCard`: Deve renderizar a cor certa (verde/vermelho) baseado na prop `trend`.
    * [ ] `ChatWidget`: Deve abrir/fechar ao clicar no botão flutuante.

---

## 🚀 Épico 3: Pipeline CI/CD (GitHub Actions)
*Foco: "Se quebrou, não entra".*

### [TASK-07] Workflow de Pull Request
* **O que é:** Automação que roda os testes toda vez que alguém tentar subir código.
* **Critérios de Aceite:**
    * [ ] Criar `.github/workflows/ci.yml`.
    * [ ] Job Backend: Instalar Python, dependências e rodar `pytest`.
    * [ ] Job Frontend: Instalar Node, deps e rodar `npm run test`.
    * [ ] Bloquear Merge se os testes falharem.

---

## 📅 Definição de Pronto (DoD) da Sprint
1.  Pipeline CI/CD passando (Verde) no GitHub.
2.  Relatório de Coverage do Backend > 80%.
3.  Nenhum teste "skipado" ou comentado sem justificativa.