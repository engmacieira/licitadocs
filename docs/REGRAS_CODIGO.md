# 🚫 PROTOCOLO DE TOLERÂNCIA ZERO PARA ADIVINHAÇÃO (ZERO GUESSING POLICY)

> **DIRETRIZ SUPREMA:** É estritamente PROIBIDO supor, adivinhar ou inventar nomes de arquivos, variáveis, funções, classes ou rotas que não estejam explicitamente visíveis no contexto atual ou nos arquivos fornecidos.

## 1. O Princípio da Leitura Prévia
Antes de escrever qualquer linha de código que interaja com outras partes do sistema (imports, chamadas de função, instâncias de classe), você deve realizar uma das duas ações:

1.  **VERIFICAR:** Se o repositório ou arquivos estão anexados, USE SUAS FERRAMENTAS para ler o arquivo de origem daquela dependência.
    * *Exemplo:* Vai editar o `auth_service.py`? Leia o `user_model.py` antes para saber se o campo é `user.id` ou `user.uuid`.
2.  **SOLICITAR:** Se o arquivo não está no contexto, PARE e solicite ao usuário:
    * *"Para evitar quebrar o código, preciso que você me envie o arquivo `app/models/user.py` para eu ver o nome exato dos atributos."*

## 2. A Regra da Imutabilidade de Dependências
Ao refatorar ou editar um arquivo funcional:
* **NÃO** altere nomes de variáveis ou funções que são importadas de outros arquivos, a menos que você também esteja editando o arquivo de origem na mesma resposta.
* **NÃO** assuma que uma função existe só porque "seria lógico" ela existir. (Ex: Não chame `repository.get_by_email()` se você não leu o arquivo do repositório para confirmar que esse método existe).

## 3. Comportamento Anti-Alucinação
Se você se deparar com um código que usa `from .utils import calculate_tax`, mas você não tem o arquivo `utils.py`:
* **CORRETO:** Manter a chamada exatamente como está (`calculate_tax()`), assumindo que ela funciona.
* **ERRADO:** Mudar para `calculate_tax_value()` porque você acha o nome mais bonito, ou tentar recriar a função `calculate_tax` no arquivo atual achando que ela não existe.

## 4. Check-List de Sanidade (Execute Mentalmente)
Antes de gerar a resposta final, faça o teste:
1.  *"Eu inventei algum import que não estava no código original?"*
2.  *"Eu mudei o nome de alguma variável que vem de fora desse arquivo?"*
3.  *"Eu tenho certeza absoluta que o método `.save()` existe nessa classe, ou estou assumindo que é um ORM padrão?"*

**SE A RESPOSTA FOR "NÃO TENHO CERTEZA": PARE. NÃO ESCREVA CÓDIGO. PEÇA O ARQUIVO.**