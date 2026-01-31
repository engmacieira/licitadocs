# 🗺️ Mapeamento de User Stories - LicitaDoc (Modelo Concierge)

**Visão do Produto:** Uma plataforma de "Compliance as a Service" para licitantes. A empresa paga para não ter dor de cabeça. Nós (LicitaDoc) buscamos, validamos e disponibilizamos as certidões. O cliente apenas baixa.

**Diferencial:** O cliente **NÃO** faz gestão de documentos. O cliente **CONSOME** documentos válidos.

---

## 🎭 Personas
1.  **O Cliente (Empresa Licitante):**
    * Contrata o plano anual.
    * Assina a procuração (Onboarding).
    * Acessa para baixar o "Kit Licitação" atualizado.
    * Usa a IA apenas para tirar dúvidas sobre o teor de uma certidão específica.
2.  **A Operação (Admin / Robôs):**
    * O "trabalhador" do sistema.
    * Monitora prazos de vencimento.
    * Renova certidões (manualmente ou via API e-CAC/Gov).
    * Faz o upload para a área do cliente.

---

## 📍 Backlog Funcional (Refinado)

### 🔐 Módulo 1: Onboarding & Contrato (A Entrada)
*O único momento onde o cliente trabalha ativamente.*

#### [US-01] Adesão e Procuração Digital
* **Como:** Novo Cliente.
* **Eu quero:** Criar minha conta, selecionar meu plano e assinar digitalmente a procuração para a LicitaDoc.
* **Para que:** A LicitaDoc tenha poderes legais para buscar minhas certidões no e-CAC e órgãos públicos.
* **Fluxo:** Cadastro -> Pagamento -> Geração automática de Procuração (PDF) -> Assinatura Digital (Integração).

---

### 📂 Módulo 2: O Cofre Digital (Visão do Cliente)
*A experiência diária: "Está tudo verde e pronto".*

#### [US-02] Dashboard de Conformidade
* **Como:** Cliente.
* **Eu quero:** Entrar no sistema e ver imediatamente se minha empresa está "Apta" (todas certidões válidas).
* **Para que:** Eu tenha paz de espírito antes de entrar em uma licitação.
* **Critério:**
    * Semáforo visual (Verde = Tudo OK, Amarelo = Renovação em andamento pela LicitaDoc).

#### [US-03] Download do Kit Licitação
* **Como:** Cliente.
* **Eu quero:** Apertar um botão "Baixar Kit Completo".
* **Para que:** O sistema gere um ZIP com todas as certidões válidas atuais organizadas por pastas (Federal, Estadual, Trabalhista).
* **Regra:** O cliente não pode fazer upload. Ele só baixa o que a LicitaDoc garantiu que está certo.

#### [US-04] O "Tira-Dúvidas" (Agente IA)
* **Como:** Cliente.
* **Eu quero:** Clicar em uma certidão (ex: "Certidão de Falência") e perguntar "O que isso significa?" ou "Até quando vale?".
* **Para que:** Eu entenda documentos jurídicos complexos sem precisar ligar para o suporte.
* **Restrição:** A IA **NÃO** lê editais de fora. Ela apenas explica os documentos que já estão na plataforma.

---

### ⚙️ Módulo 3: A Fábrica de Certidões (Visão Admin/Robô)
*Onde o trabalho pesado acontece.*

#### [US-05] Gestão de Vencimentos (Radar)
* **Como:** Admin (Operação).
* **Eu quero:** Um painel que mostre quais clientes têm certidões vencendo nos próximos 10 dias.
* **Para que:** Eu possa renová-las antes que o cliente perceba ou precise.

#### [US-06] Renovação Automática (Integrações)
* **Como:** Sistema (Robô).
* **Eu quero:** Conectar nas APIs públicas (e-CAC, CNDT, FGTS) usando os dados do cliente.
* **Para que:** O sistema baixe o novo PDF e atualize a data de validade automaticamente na plataforma, sem intervenção humana.