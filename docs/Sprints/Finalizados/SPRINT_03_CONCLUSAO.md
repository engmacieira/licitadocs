# 🏁 Log de Sprint: 03 - Hierarquia e Admin Mode

**Período:** 17/01/2026
**Status:** Concluído
**Foco:** Pivotagem para modelo de negócio "Concierge" (Gestão ativa pela equipe interna).

## 🚀 Entregas Realizadas (O Que)

* **[Database]** Implementação de Roles (`admin`, `client`) na tabela de usuários.
* **[Seed]** Script `create_first_admin.py` para gerar superusuários.
* **[Segurança]** Middleware `get_current_active_admin` protegendo rotas sensíveis.
* **[Upload Concierge]** Refatoração do Upload para permitir que Admins enviem arquivos em nome de Clientes (`target_company_id`).
* **[Backoffice]** Novo `AdminRouter` com rota de listagem de empresas (`GET /admin/companies`) para popular dropdowns de gestão.
* **[Fix]** Correção no cadastro automático de empresas (CNPJ Dinâmico) para evitar erros de constraint no banco.

## 🧠 Retrospectiva (O Como)

### ✅ O que funcionou bem?
* **Decisão de Pivotar:** Parar para escrever o `USER_STORIES.md` economizou semanas de dev. Percebemos que o modelo "Auto-Serviço" não era o ideal para o serviço premium que queremos vender.
* **Testes como Documentação:** Os testes nos salvaram de bugs silenciosos (como o erro de CNPJ duplicado) antes mesmo de abrirmos o Postman.
* **Simplificação do MVP:** Cortar as integrações de Assinatura e Governo agora nos permitiu focar no que importa: O Admin conseguir trabalhar.

### ⚠️ Lições Aprendidas
* **Contexto de Testes:** Tivemos dificuldades com fixtures do Pytest (`db_session` vs `client`), mas resolvemos padronizando o `conftest.py`. Aprendizado: Sempre isolar o banco de teste do banco de produção.

---
**Assinatura:** Tech Lead & Dev (Matheus e Mark)