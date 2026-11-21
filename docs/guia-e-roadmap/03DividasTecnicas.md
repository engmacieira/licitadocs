# 💸 Dívidas Técnicas e Melhorias Futuras

**Status Geral:** Sob Controle (Limpeza da Sprint 20 finalizada)

> "Código bom é código que evolui. Se deixamos algo para trás de forma consciente, registramos aqui para não esquecer e pagamos antes que os juros fiquem altos."

---

## 🚨 Crítico (Prioridade Alta)
*Zero dívidas críticas conhecidas no momento! A fundação está sólida.*

---

## ⚠️ Atenção (Prioridade Média)
*Funcionalidades incompletas, validações fracas ou lógica de negócio repetitiva.*

* **[Qualidade] Execução Completa de Testes E2E em CI/CD**
    * *Problema:* A estrutura inicial do Playwright (`frontend/playwright.config.ts` e `frontend/e2e/auth-and-upload.spec.ts`) já foi configurada com rotas interceptadas, mas ainda falta integrar a execução em CI contra backend PostgreSQL real e ampliar a cobertura para demais fluxos.
    * *Solução:* Adicionar job no GitHub Actions com `playwright install` e ambiente de teste completo.

---

## 🟢 Baixa Prioridade (Cosmético/UX e DX)
*Melhorias de interface ou de experiência do desenvolvedor (DX).*

* **[Frontend/Backend] Paginação Real nos Endpoints do Dashboard:** Os painéis de recentes já possuem links para as listagens completas (`/documents`, `/admin/validity-monitor`, `/admin/companies`), porém os endpoints `/dashboard/admin/stats` e `/dashboard/client/stats` ainda retornam fixos os 5 primeiros itens sem parâmetros `page`/`limit`.
* **[Backend] Seeds de Teste Robustos:** Criar um script `seed.py` mais robusto utilizando a biblioteca `Faker` para popular o banco para testes de carga.

---

## ✅ Dívidas Pagas (Histórico Recente)

> Itens resolvidos, testados e eliminados. O código agradece! 🎉

* **~~[Segurança/Arquitetura] Separação de Endpoint para Troca de Senha~~** (Pago)
    * *Solução:* Criado endpoint dedicado `PATCH /users/me/password` com `PasswordUpdateDTO` e validação obrigatória de `current_password`. Removidos `password` e `current_password` de `UserUpdate` e `PATCH /users/me`. Frontend migrado para `userService.updatePassword`.
* **~~[Manutenibilidade] Mapeamento Manual de DTOs no Onboarding~~** (Pago)
    * *Solução:* Criado `OnboardingCompanyDTO` com `validation_alias=AliasChoices(...)` em `app/schemas/user_schemas.py` e adotado nas rotas `register` e `oauth_register` do `auth_router.py`.
* **~~[Manutenibilidade] Hardcoded PDF no Upload~~** (Pago)
    * *Solução:* Adicionada constante `ALLOWED_EXTENSIONS` em `app/core/config.py` e aplicada na validação de extensão da rota `/documents/upload` em `app/routers/document_router.py`.
* **~~[Frontend] Refatorar `StatsCard`~~** (Pago)
    * *Solução:* Extraídas constantes declarativas `STATS_CARD_VARIANTS` e `TREND_VARIANTS` com Tailwind em `frontend/src/components/ui/StatsCard.tsx`.
* **~~[Qualidade] Estrutura Inicial de Testes E2E (Playwright)~~** (Pago)
    * *Solução:* Configurado `@playwright/test`, script `test:e2e`, `frontend/playwright.config.ts` e suíte inicial em `frontend/e2e/auth-and-upload.spec.ts`.

* **~~[Segurança/Infra] SECRET_KEY e Credenciais do Banco Expostas~~** (Pago na Sprint 20)
    * *Solução:* Adicionado padrão Fail Fast (`sys.exit()`) no `database.py` e `security.py`. Uso obrigatório e exclusivo do `.env`.
* **~~[Segurança] Endpoint de Simulação de Pagamento~~** (Pago na Sprint 20)
    * *Solução:* Blindado com Feature Flag (`ENV=production` bloqueia o endpoint com 403 Forbidden).
* **~~[Validação] CNPJ e CPF no Backend~~** (Pago na Sprint 20)
    * *Solução:* Validação matemática de Dígitos Verificadores (DV) nativa nos Schemas do Pydantic.
* **~~[Arquitetura] Centralizar Regras de Permissão (RBAC)~~** (Pago na Sprint 20)
    * *Solução:* Fábrica `require_role` injetada via `Depends()` nos routers.
* **~~[Performance] Filtro de Documentos por Empresa (Admin)~~** (Pago na Sprint 20)
    * *Solução:* Refatorado e associado ao novo RBAC para garantir N+1 seguro no banco.