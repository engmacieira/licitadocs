# 🗺️ Sprint 24: Refinamento de Fluxos, Assinaturas e Painel Administrativo

**Objetivo:** Otimizar o onboarding de clientes (termos, assinaturas e dados), separar claramente os documentos do cliente do cofre do admin, e criar novas ferramentas de gestão e comunicação.
**Status:** Planejamento
**Tecnologia Principal:** FastAPI / React / PostgreSQL / Integração IA / API IBGE (Endereços)

---

## 🎯 Backlog de Funcionalidades (Escopo)
*Funcionalidades selecionadas com base nos testes de usabilidade recentes.*

### 📦 1. Onboarding, Contratos e Dados da Empresa
* **[US-2401] Aceite de Termos Simplificado**
    * **O que é:** Modificar a página `contract-sign` para focar apenas no aceite dos termos de uso completos da plataforma.
    * **Critério de Aceite:** Textos completos visíveis e remoção do fluxo de assinatura de contrato/procuração desta tela.
* **[US-2402] Fluxo Interno de Assinatura (Contrato e Procuração)**
    * **O que é:** Criar um layout interno onde a empresa baixa os documentos pré-preenchidos, assina no gov.br e faz o upload.
    * **Critério de Aceite:** Documentos gerados com dados do banco e área para upload dos arquivos assinados.
* **[US-2403] Preenchimento de Endereço via API**
    * **O que é:** Utilizar biblioteca/API para seleção de Cidade e Estado, com campos separados, substituindo a digitação manual.
* **[US-2404] Novo Dashboard do Cliente (Flags de Regularidade)**
    * **O que é:** Exibir status de 5 passos: 1. Aceite de termos; 2. Pagamento; 3. Dados completos; 4. Assinatura/Upload de Contratos; 5. Validação da Equipe.

### 📦 2. Gestão de Documentos e Cofre (Admin)
* **[US-2405] Separação de Documentos: Cliente vs. Cofre**
    * **O que é:** Isolar os documentos enviados pelo usuário, mantendo-os apenas no perfil da empresa, sem misturar com o Cofre gerido pelo admin.
* **[US-2406] Validação de Documentação e Pendências**
    * **O que é:** Adicionar campo na tela `admin/companies` para o admin informar o que precisa ser corrigido caso a documentação da empresa tenha pendências.
* **[US-2407] Refinamento da Tela de Novo Upload**
    * **O que é:** Remover campos duplicados (Data de Validade/Código) e permitir edição dessas informações em documentos já enviados.
* **[US-2408] Hiperlinks Dinâmicos para Emissão de Certidões**
    * **O que é:** Botão no cadastro da certidão para abrir o site de emissão em nova aba, buscando dinamicamente a URL correta com base no estado/município da empresa.
* **[US-2409] Gestão CND Municipal Manual**
    * **O que é:** Layout específico para CNDs de prefeituras sem portal, armazenando dados de contato (email, telefone, whatsapp) da divisão responsável para solicitação manual.
* **[US-2410] Monitoramento de Validade**
    * **O que é:** Nova tela para o admin visualizar certidões próximas do vencimento.
* **[US-2411] Alerta de Irregularidade em CND**
    * **O que é:** Mecanismo fácil para o admin notificar a empresa caso seja constatada irregularidade na busca de uma certidão.

### 📦 3. Comunicação e Assistente IA
* **[US-2412] Caixa de Mensagens (Inbox)**
    * **O que é:** Novo módulo para comunicação contendo avisos automáticos do sistema e chat direto entre Admin e Clientes.
* **[US-2413] Correções no Chat IA**
    * **O que é:** Corrigir CSS para permitir quebra de linha de texto, consertar erro de integração e blindar o prompt para que a IA responda apenas sobre o cofre e localização de documentos.

### 📦 4. Ajustes Finais e Frontend (UX)
* **[US-2414] Ajustes no Dashboard Admin**
    * **O que é:** Remover bloco do "robô de captura" e habilitar os links de atalhos rápidos.
* **[US-2415] Refinamento da Tela de Demonstração**
    * **O que é:** Ajustar funcionalidades mostradas, informar preço (12x R$14,90 por 12 meses), remover menção a alerta de vencimento para empresa e ajustar texto sobre o real papel da IA (não analisa edital).

---

## 🛠️ Plano Técnico de Execução
*O passo a passo para o desenvolvedor (Mark).*

1.  **Setup/Infra:** Atualizar dependências caso necessitemos de pacotes específicos para parsear Markdown no chat ou buscar APIs de IBGE (`axios` ou similar).
2.  **Database:** Criar migrations (Alembic) para:
    * Tabela de Mensagens (`Message`).
    * Novas flags na tabela de Empresa/Contratos (Termos, Pagamento, Validação, Pendências).
    * Tabela/Campos para contatos de Prefeituras (CND Municipal).
3.  **Backend:**
    * Atualizar `company_router` e models para aceitar e retornar as novas flags.
    * Criar endpoints para o Chat/Caixa de Mensagens.
    * Ajustar o prompt base do `ai_service.py` reforçando a restrição estrita ao contexto do cofre.
4.  **Frontend:**
    * Refatorar `pages/ContractSign/index.tsx`.
    * Integrar a API do IBGE no `company-settings`.
    * Ajustar estilos globais (CSS) do ChatWidget para tratar `white-space: pre-wrap;` nas quebras de linha da IA.
5.  **Testes:** Garantir que o upload do cliente não apareça de forma alguma na rota que popula a grid do Cofre administrativo.

---

## 📝 Definição de Pronto (DoD)
*Checklist para considerar a Sprint finalizada.*

* [ ] Código commited e pushado.
* [ ] Migrations do banco de dados geradas e aplicadas no ambiente de testes.
* [ ] Funcionalidades testadas manualmente (Fluxo do Cliente vs Fluxo do Admin).
* [ ] Documentação (`DividasTecnicas.md` e `Por_Onde_Comecar.md`) atualizada.