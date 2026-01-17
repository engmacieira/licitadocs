# 🗺️ Mapeamento de User Stories - LicitaDoc (Modelo Concierge)

**Visão do Produto:** Uma plataforma de gestão ativa de documentação licitatória. A empresa assina, nos dá poderes legais (procuração), e nossa equipe/robôs garantem que todas as certidões estejam válidas e disponíveis na nuvem, explicadas por IA.

---

## 🎭 Personas (Quem usa?)
* **Cliente (Empresa Licitante):** Contrata o serviço para não ter dor de cabeça. Acessa a plataforma apenas para: Assinar a procuração, Consultar documentos e Ler os resumos da IA.
* **Operador (Admin/Time Interno):** Responsável por buscar as certidões (manualmente ou via robôs), fazer o upload e garantir a validade.
* **Agente IA (Gemini):** O "Consultor Jurídico Virtual" que traduz o conteúdo técnico para o Cliente.

---

## 📍 Backlog de Funcionalidades

### 🔐 Módulo 1: Onboarding Legal (A Entrada)
*Onde o cliente entra e nos autoriza a trabalhar.*

#### [US-01] Assinatura Digital de Procuração
* **Como:** Cliente (Empresa)
* **Eu quero:** Assinar o contrato e a procuração digitalmente dentro da plataforma (sem imprimir papel).
* **Para que:** Eu autorize a LicitaDoc a buscar documentos em meu nome junto aos órgãos públicos.
* **Critérios de Aceite:**
    * [ ] Integração com API de Assinatura (ex: ZapSign, ClickSign ou DocuSign).
    * [ ] Geração automática do PDF da procuração com os dados da empresa.
    * [ ] Status do usuário muda de "Pendente" para "Ativo" após a assinatura.

---

### 🏭 Módulo 2: Fábrica de Certidões (Backoffice)
*Onde a mágica acontece (nossa responsabilidade).*

#### [US-02] Coleta e Upload Centralizado
* **Como:** Operador (Admin) ou Robô
* **Eu quero:** Enviar as certidões coletadas para a pasta do cliente específico.
* **Para que:** O cliente tenha o documento oficial disponível para download imediato.
* **Critérios de Aceite:**
    * [ ] Upload de PDF vinculado obrigatoriamente a uma Empresa.
    * [ ] Sistema deve impedir upload se a empresa não tiver contrato ativo.
    * [ ] (Futuro) Integração com APIs do Governo para busca automática (Busca de CND Federal, FGTS, etc.).

#### [US-03] Controle de Validade e Renovação
* **Como:** Operador (Admin)
* **Eu quero:** Um painel que mostre quais clientes estão com documentos prestes a vencer.
* **Para que:** Eu possa agir proativamente e renovar a certidão antes que ela expire.
* **Critérios de Aceite:**
    * [ ] Dashboard "Semáforo": Verde (Em dia), Amarelo (Vence em 10 dias), Vermelho (Vencido).
    * [ ] Disparo de alerta para o Operador renovar a certidão.

---

### 🤖 Módulo 3: Inteligência e Consumo (O Valor para o Cliente)

#### [US-04] Tradutor de "Juridiquês" (Gemini AI)
* **Como:** Cliente (Empresa)
* **Eu quero:** Ler um resumo simples e direto sobre o status da minha certidão.
* **Para que:** Eu saiba se tenho alguma pendência ("Positiva") sem precisar entender termos jurídicos complexos.
* **Critérios de Aceite:**
    * [ ] Ao detectar novo upload, o sistema envia o texto para a API do Google Gemini.
    * [ ] O Prompt deve pedir: Resumo, Status (Positiva/Negativa) e Ações Recomendadas.
    * [ ] Exibir o resumo em um card amigável ao lado do botão de download.

#### [US-05] Visualização da Carteira
* **Como:** Cliente (Empresa)
* **Eu quero:** Ver todos os meus documentos organizados por categorias (Federal, Estadual, Trabalhista).
* **Para que:** Eu encontre rapidamente o que o edital da licitação está pedindo.
* **Critérios de Aceite:**
    * [ ] Filtros por tipo de certidão.
    * [ ] Indicador visual claro de validade (Badge Verde/Vermelho).
    * [ ] Botão de "Baixar Tudo" (ZIP) para facilitar o envio em licitações.

---

### 💰 Módulo 4: Comercial (SaaS)

#### [US-06] Gestão de Assinatura
* **Como:** Admin
* **Eu quero:** Que o sistema bloqueie o acesso a novos downloads se o pagamento mensal não for identificado.
* **Para que:** Garantir a sustentabilidade do negócio de R$ 14,99.
* **Critérios de Aceite:**
    * [ ] Integração com Gateway de Pagamento (Cobrança Recorrente).
    * [ ] Bloqueio automático de visualização em caso de inadimplência.

---

## 🛠️ Tecnologias e Integrações Mapeadas
* **IA/LLM:** Google Gemini API (Análise de texto).
* **Assinatura Digital:** ClickSign ou ZapSign (APIs brasileiras com custo-benefício bom para startups).
* **Gov Data:** BrasilAPI (Open Source) ou Serpro (Pago/Oficial) para automações futuras.