import pytest
from app.utils.validators import validar_matematica_cpf, validar_matematica_cnpj

def test_validar_cpf_valido():
    # CPFs válidos gerados aleatoriamente
    assert validar_matematica_cpf("52998224725") == "52998224725"
    assert validar_matematica_cpf("000.111.222-33") == "00011122233"

def test_validar_cpf_invalido_tamanho():
    with pytest.raises(ValueError, match="11 dígitos"):
        validar_matematica_cpf("123456789")

def test_validar_cpf_invalido_sequencia():
    with pytest.raises(ValueError, match="sequência repetida"):
        validar_matematica_cpf("11111111111")

def test_validar_cpf_invalido_dv():
    with pytest.raises(ValueError, match="1º dígito falhou"):
        validar_matematica_cpf("12345678909")
    with pytest.raises(ValueError, match="2º dígito falhou"):
        validar_matematica_cpf("52998224726")

def test_validar_cnpj_valido():
    # CNPJs válidos gerados aleatoriamente
    assert validar_matematica_cnpj("11.444.777/0001-61") == "11444777000161"
    assert validar_matematica_cnpj("11444777000161") == "11444777000161"

def test_validar_cnpj_invalido_tamanho():
    with pytest.raises(ValueError, match="14 dígitos"):
        validar_matematica_cnpj("1234567890123")

def test_validar_cnpj_invalido_sequencia():
    with pytest.raises(ValueError, match="sequência repetida"):
        validar_matematica_cnpj("11111111111111")

def test_validar_cnpj_invalido_dv():
    with pytest.raises(ValueError, match="1º dígito falhou"):
        validar_matematica_cnpj("11444777000162")
    with pytest.raises(ValueError, match="2º dígito falhou"):
        validar_matematica_cnpj("11444777000160")
