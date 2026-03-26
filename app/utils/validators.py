import re

def validar_matematica_cpf(v: str) -> str:
    """
    Executa a validação matemática do CPF.
    Garante integridade dos dados antes da persistência no banco.
    """
    if not v:
        return v
        
    # 1. Limpeza de formatação
    numeros = re.sub(r'\D', '', v)
    
    # 2. Verificação de tamanho básico
    if len(numeros) != 11:
        # A mensagem agora contém o fragmento "11 dígitos" esperado pelo teste
        raise ValueError('O CPF deve conter exatamente 11 dígitos')
        
    # 2.1 Verificação de sequências repetidas
    if numeros == numeros[0] * 11:
        # A mensagem agora contém o fragmento "sequência repetida" esperado pelo teste
        raise ValueError('O CPF não pode ser uma sequência repetida')
        
    # 3. Cálculo do 1º dígito verificador
    soma = sum(int(numeros[i]) * (10 - i) for i in range(9))
    resto = (soma * 10) % 11
    if resto == 10: resto = 0
    if resto != int(numeros[9]):
        raise ValueError('CPF inválido (1º dígito falhou)')

    # 4. Cálculo do 2º dígito verificador
    soma = sum(int(numeros[i]) * (11 - i) for i in range(10))
    resto = (soma * 10) % 11
    if resto == 10: resto = 0
    if resto != int(numeros[10]):
        raise ValueError('CPF inválido (2º dígito falhou)')

    return numeros