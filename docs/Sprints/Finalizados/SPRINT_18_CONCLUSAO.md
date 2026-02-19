# 🏁 Log de Sprint: 18 - Gestão Profissional do Catálogo (Settings)

**Status:** Concluído ✅
**Foco:** Desenvolver o módulo administrativo definitivo para gestão de Categorias e Tipos de Documentos, eliminando a necessidade de manipulação manual do banco de dados e garantindo a integridade relacional.

## 🚀 Entregas Realizadas (O Que)
*Resumo técnico do que foi construído.*

* **[Backend - Repositório]** Implementação dos métodos de CRUD (Create, Update, Delete) para Categorias e Tipos no `DocumentRepository`.
* **[Backend - Motor de Regras]** Adicionada proteção de Integridade Relacional: bloqueio de exclusão de Categorias que possuem Tipos vinculados, e bloqueio de exclusão de Tipos que possuem Certidões de clientes.
* **[Backend - API]** Criação das rotas `POST`, `PUT` e `DELETE` em `document_router.py`, protegidas e restritas apenas para utilizadores com a role `ADMIN`.
* **[Qualidade - Testes]** Implementação do `test_settings_sprint18.py` com 100% de aprovação, focando no "Caminho Feliz" e na blindagem das regras de negócio (erros 400 esperados).
* **[Frontend - Serviços]** Atualização do `documentService.ts` com os novos DTOs de criação/edição e mapeamento dos endpoints.
* **[Frontend - Interface]** Criação da `SettingsPage` (`/settings`) contendo a listagem interativa do catálogo e modais dinâmicos (`CategoryModal` e `TypeModal`) geridos com `react-hook-form`.
* **[Frontend - UX/Segurança]** Adicionados alertas de confirmação (`window.confirm`) antes de ações destrutivas e feedback visual via `toast` para sucesso e erros do backend.

## 🧠 Retrospectiva (O Como)
*Análise crítica para melhoria contínua.*

### ✅ O que funcionou bem?
* **Delegação de Responsabilidade:** O Frontend ficou muito "leve" porque toda a regra de negócio pesada (saber se pode ou não pode apagar algo) ficou no Repositório do Backend. O React apenas reage à resposta da API.
* **Componentização Inteligente:** Dividir a página de `Settings` em sub-componentes (Modais) no mesmo ficheiro facilitou o estado local e manteve o código organizado e fácil de ler.

### ⚠️ Lições Aprendidas / Obstáculos
* **Testes vs. Acentuação (Windows):** Tivemos um falso negativo no `pytest` por conta de diferenças de codificação (acentos) no terminal do Windows ao tentar usar o parâmetro `match` no `pytest.raises`. A solução foi flexibilizar a expressão regular para focar na essência da mensagem, evitando quebra por *encoding*.

---

## 📊 Status Final
* **Dívidas Técnicas Geradas:** Nenhuma no escopo desta sprint. O Catálogo agora é 100% autossuficiente e livre de hardcode.
* **Próximos Passos:** O motor base do Cofre Digital está finalizado. Os próximos épicos podem focar na evolução do sistema, como: **Dashboard de Métricas** (ver quais os documentos que estão a vencer), **Gestão de Utilizadores/Empresas**, ou **Sistema de Notificações**.

---
**Assinatura:** Tech Lead & Dev (Mark Construtor e Matheus)