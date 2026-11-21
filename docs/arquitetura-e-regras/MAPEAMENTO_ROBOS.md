# 🧭 Mapeamento de Viabilidade: Robôs de Extração (Sprint 23)

Este documento cataloga a viabilidade técnica de automatizar a extração das certidões padrão do LicitaDocs.

## 📊 Matriz de Classificação de Dificuldade
* **🟢 Nível 1 (Baixa):** APIs Abertas. Retorno em JSON ou link direto para PDF.
* **🟡 Nível 2 (Média):** Web Scraping Simples (POST/GET). Sem Captcha complexo, apenas tokens de sessão ou cookies.
* **🟠 Nível 3 (Alta):** Exige quebra de Captcha (AntiCaptcha/2Captcha), Webdriver (Playwright/Selenium) ou navegação complexa.
* **🔴 Nível 4 (Manual):** Impossível via robô básico. Exige e-CNPJ (Certificado Digital), gov.br, ou o documento é estritamente físico/notarial.

---

## 📂 1. Habilitação Jurídica
| Documento | Dificuldade | Estratégia Sugerida | Requer Captcha? | Observações |
| :--- | :---: | :--- | :---: | :--- |
| **Cartão CNPJ** | 🟢 Nível 1 | `RECEITA_WS_API` ou `BRASIL_API` | Não | Podemos gerar um PDF estruturado internamente a partir do JSON da BrasilAPI (Gratuito). |
| **Contrato Social** | 🔴 Nível 4 | `is_automatable: False` | - | Requer acesso via Junta Comercial (geralmente com certificado digital do contador/sócio). **Manual.** |
| **RG/CPF Sócios** | 🔴 Nível 4 | `is_automatable: False` | - | Documento pessoal. **Manual.** |

## 📂 2. Regularidade Fiscal e Trabalhista
| Documento | Dificuldade | Estratégia Sugerida | Requer Captcha? | Observações |
| :--- | :---: | :--- | :---: | :--- |
| **CND Trabalhista (TST)** | 🟡 Nível 2 | `TST_CRAWLER_V1` | Sim/Não | O portal tem um endpoint de emissão. Dependendo da volumetria, pode pedir validação básica, mas é contornável via `requests`. |
| **CRF do FGTS (Caixa)** | 🟠 Nível 3 | `FGTS_CRAWLER_V1` | Sim | Portal da Caixa é altamente instável e exige resolução de Captcha visual ou análise de tokens HTML. Requer Playwright. |
| **CND Federal (Receita)** | 🟠 Nível 3 | `RECEITA_FEDERAL_SCRAPER` | Sim | Exige hCaptcha/reCaptcha e envio do CNPJ via form. O PDF é gerado num popup/nova aba. |
| **CND Estadual (SEFAZ)** | 🟠 Nível 3 / 4 | Depende do Estado | Sim | Cada estado tem um site diferente. Alguns exigem Inscrição Estadual (IE) obrigatória. Sugestão: adiar para V2. |
| **CND Municipal** | 🔴 Nível 4 | Depende do Município | Sim | Existem mais de 5.000 prefeituras, cada uma com o seu sistema. **Manual por agora.** |

## 📂 3. Qualificação Econômico-Financeira
| Documento | Dificuldade | Estratégia Sugerida | Requer Captcha? | Observações |
| :--- | :---: | :--- | :---: | :--- |
| **Balanço Patrimonial** | 🔴 Nível 4 | `is_automatable: False` | - | Documento contábil interno assinado. **Manual.** |
| **Cert. Falência/Concordata** | 🟠 Nível 3 | Depende do TJ Estadual | Sim | Emitido pelo Tribunal de Justiça do estado da empresa. |

## 📂 4. Qualificação Técnica
| Documento | Dificuldade | Estratégia Sugerida | Requer Captcha? | Observações |
| :--- | :---: | :--- | :---: | :--- |
| **Atestado Técnico** | 🔴 Nível 4 | `is_automatable: False` | - | Emitido por clientes antigos da empresa. **Manual.** |
| **Registro no Conselho** | 🟠 Nível 3 | Depende do Conselho | Sim | CREA, CAU, CRA têm portais próprios e distintos. |

---

## 🎯 Conclusão e Plano de Ação
Nesta Sprint 23, focaremos em construir os robôs das frutas mais baixas (Nível 1 e 2):
1. **Cartão CNPJ** (Nível 1) via BrasilAPI.
2. **CND Trabalhista - TST** (Nível 2) via portal oficial.