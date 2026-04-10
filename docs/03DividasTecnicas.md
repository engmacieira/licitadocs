# 💸 Dívidas Técnicas e Melhorias Futuras

**Status Geral:** Sob Controle (Limpeza da Sprint 20 finalizada)

> "Código bom é código que evolui. Se deixamos algo para trás de forma consciente, registramos aqui para não esquecer e pagamos antes que os juros fiquem altos."

---

## 🚨 Crítico (Prioridade Alta)
*Zero dívidas críticas conhecidas no momento! A fundação está sólida.*

---

## ⚠️ Atenção (Prioridade Média)
*Funcionalidades incompletas, validações fracas ou lógica de negócio repetitiva.*

* **[Manutenibilidade] Mapeamento Manual de DTOs**
    * *Problema:* O `auth_router.py` faz conversão manual de campos (`legal_name` -> `razao_social`). Aumenta chance de erro humano.
    * *Solução:* Utilizar `validation_alias` do Pydantic ou padronizar o idioma (inglês/português) entre Frontend e Banco de Dados.
* **[Manutenibilidade] Hardcoded PDF no Upload**
    * *Problema:* A validação `file.filename.endswith('.pdf')` está hardcoded na rota.
    * *Solução:* Mover para uma constante de configuração `ALLOWED_EXTENSIONS`.
* **[Qualidade] Testes End-to-End (E2E) no Frontend**
    * *Problema:* Não temos testes cobrindo a jornada real do usuário no navegador.
    * *Solução:* Configurar Playwright/Cypress para testar o fluxo de cadastro e envio de documentos.
* **[Segurança/Arquitetura] Separação de Endpoint para Troca de Senha**
    * *Problema:* O endpoint genérico de atualização de perfil (`PATCH /users/me`) mistura a edição de dados pessoais (nome, CPF) com dados sensíveis (alteração de senha e senha atual). Isso é uma brecha arquitetural que dificulta a implementação de fluxos de segurança específicos, como auditoria, invalidação de sessões antigas ou bloqueio por tentativas falhas.
    * *Solução:* Isolar a lógica de senhas criando um endpoint dedicado (ex: `POST /users/me/password` ou `PATCH /users/me/password`) recebendo um DTO exclusivo (`PasswordUpdateDTO`), além de remover esses campos da interface genérica `UserProfile`.

---

## 🟢 Baixa Prioridade (Cosmético/UX e DX)
*Melhorias de interface ou de experiência do desenvolvedor (DX).*

* **[Frontend] Refatorar `StatsCard`:** Componente mistura lógica de apresentação (cores hardcoded) com dados. Criar um padrão de variantes com Tailwind.
* **[Frontend] Paginação Real no Dashboard:** As listas de "Recentes" trazem apenas 5 itens, mas não há um link "Ver Todos" paginado.
* **[Backend] Seeds de Teste Robustos:** Criar um script `seed.py` mais robusto utilizando a biblioteca `Faker` para popular o banco para testes de carga.

---

## ✅ Dívidas Pagas (Histórico Recente)

> Itens resolvidos, testados e eliminados. O código agradece! 🎉

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