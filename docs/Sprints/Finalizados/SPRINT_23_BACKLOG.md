# 🗺️ Sprint 23: Mapeamento de Órgãos e Implementação de Robôs Reais

**Objetivo:** Pesquisar as fontes oficiais de emissão das certidões, classificar a viabilidade técnica de cada uma e implementar os robôs reais para as certidões de alta viabilidade (sem captchas complexos ou necessidade de Certificado Digital A1).
**Status:** Planeamento
**Tecnologia Principal:** Python (`requests`, `playwright`), APIs Públicas (BrasilAPI, ReceitaWS), Portais do Governo.

---

## 🎯 Backlog de Funcionalidades (Escopo)

### 📦 1. Pesquisa e Arquitetura (Spike)
* **[US-AT9] Mapeamento de Viabilidade Técnica**
    * **O que é:** Criar um documento técnico que lista cada certidão do nosso catálogo atual (Sprint 17/21) detalhando: URL de emissão, se tem API oficial, se exige Captcha (hCaptcha, reCaptcha), se exige Certificado Digital (e-CNPJ) e se exige dados extras (ex: Inscrição Estadual).
    * **Critério de Aceite:** Tabela consolidada definindo quais serão os `strategy_name` e quais ficarão como `is_automatable = False`.

### 📦 2. Implementação dos Robôs (Alta Viabilidade)
* **[US-AT10] Robô Real: CND Trabalhista (TST)**
    * **O que é:** Atualizar o nosso `TSTCrawlerV1` para bater no endpoint real do Tribunal Superior do Trabalho em vez do PDF de teste.
    * **Critério de Aceite:** O robô deve conseguir emitir a CND real do TST a partir de um CNPJ válido e lidar com o caso de "CNPJ com pendências" (onde o PDF gerado é uma Certidão Positiva).

* **[US-AT11] Robô Real: Cartão CNPJ & CND Federal**
    * **O que é:** Implementar um robô (ex: `ReceitaFederalCrawler`) que utiliza APIs abertas e gratuitas (como a *BrasilAPI* ou *MinhaReceita*) ou faz scraping do portal da Receita para buscar o Cartão CNPJ e a Certidão Conjunta de Débitos.
    * **Critério de Aceite:** PDFs ou dados estruturados gravados no Cofre da empresa.

### 📦 3. Gestão das Exceções (Processo Manual)
* **[US-AT12] Otimização do Fluxo de Certidões Manuais**
    * **O que é:** Garantir que o sistema lida perfeitamente com os documentos marcados como `is_automatable = False` (Ex: Contrato Social, Balanço Patrimonial, Atestado Técnico).
    * **Critério de Aceite:** Como o Orquestrador já ignora estes documentos, precisamos apenas de garantir (visualmente no frontend) que a equipa operacional saiba quais empresas estão com estes documentos pendentes para fazerem o upload à mão.

---

## 🛠️ Estratégia de Combate (Tipos de Robôs)

Nesta sprint, vamos categorizar os nossos alvos em 4 níveis de dificuldade:
1. **🟢 Nível 1 (APIs Abertas):** Fácil. Dados vêm em JSON estruturado ou o PDF tem um link direto. (Ex: Cartão CNPJ via BrasilAPI).
2. **🟡 Nível 2 (Scraping Simples):** Médio. O site não tem Captcha, mas precisamos enviar um POST form e sacar o PDF da resposta. (Ex: TST, CND Federal).
3. **🟠 Nível 3 (Captcha/Webdriver):** Difícil. Exige subir o `Playwright`/`Selenium` e integrar com serviços como o *2Captcha* ou *AntiCaptcha* para resolver o desafio visual. (Ex: FGTS, CNDs Estaduais).
4. **🔴 Nível 4 (Impossível/Manual):** Requer intervenção humana, login com gov.br, token de telemóvel ou não existe online. (Ex: Contrato Social original, RG dos sócios, Balanço Assinado).