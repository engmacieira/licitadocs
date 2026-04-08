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
        raise ValueError('O CPF deve conter exatamente 11 dígitos')
        
    # 2.1 Verificação de sequências repetidas
    if numeros == numeros[0] * 11:
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

def validar_matematica_cnpj(v: str) -> str:
    """
    Executa a validação matemática do CNPJ.
    Garante integridade dos dados antes da persistência no banco.
    """
    if not v:
        return v

    # 1. Limpeza de formatação
    numeros = re.sub(r'\D', '', v)

    # 2. Verificação de tamanho básico
    if len(numeros) != 14:
        raise ValueError('O CNPJ deve conter exatamente 14 dígitos')

    # 2.1 Verificação de sequências repetidas
    if numeros == numeros[0] * 14:
        raise ValueError('O CNPJ não pode ser uma sequência repetida')

    # 3. Cálculo dos dígitos verificadores
    def calcular_dv(payload, pesos):
        soma = sum(int(payload[i]) * pesos[i] for i in range(len(pesos)))
        resto = soma % 11
        return 0 if resto < 2 else 11 - resto

    # 1º DV
    if calcular_dv(numeros, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) != int(numeros[12]):
        raise ValueError('CNPJ inválido (1º dígito falhou)')

    # 2º DV
    if calcular_dv(numeros, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) != int(numeros[13]):
        raise ValueError('CNPJ inválido (2º dígito falhou)')

    return numeros