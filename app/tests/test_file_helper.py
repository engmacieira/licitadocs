"""
Testes Unitários: Auxiliar de Arquivos (File Helper).
Garante que o salvamento físico de arquivos retorna os bytes corretos,
e que falhas de disco ativam a rotina de limpeza (rollback) para não deixar lixo.
"""
import pytest
import os
from io import BytesIO
from unittest.mock import patch
from fastapi import UploadFile

from app.utils.file_helper import save_upload_file

# ==========================================
# 💾 TESTES DE SISTEMA DE ARQUIVOS
# ==========================================

def test_save_upload_file_success(tmp_path):
    """
    Cenário: Upload de arquivo bem sucedido.
    Resultado Esperado: Retornar o caminho e o tamanho exato dos bytes escritos.
    """
    # 1. Setup: Criamos um UploadFile falso direto na memória (RAM)
    conteudo_falso = b"Conteudo do meu PDF de teste"
    arquivo_memoria = BytesIO(conteudo_falso)
    upload_file = UploadFile(filename="contrato_social.pdf", file=arquivo_memoria)
    
    # 2. Ação: Interceptamos a variável UPLOAD_DIR para salvar na pasta temporária do Pytest
    with patch("app.utils.file_helper.UPLOAD_DIR", tmp_path):
        caminho_salvo, tamanho = save_upload_file(upload_file, "empresas_teste")
        
    # 3. Validação
    assert "empresas_teste" in caminho_salvo
    assert caminho_salvo.endswith(".pdf")
    assert tamanho == len(conteudo_falso)
    assert os.path.exists(caminho_salvo) # O arquivo realmente tem que estar no disco (temporário)
    assert upload_file.file.closed is True # O finally TEM que ter fechado o ponteiro!

def test_save_upload_file_exception_cleanup(tmp_path):
    """
    Cenário QA [Estresse]: O disco enche ou dá erro de I/O na metade da cópia.
    Resultado Esperado: O bloco 'except' captura o erro, APAGA o arquivo parcial
    e repassa a Exception para a frente.
    """
    # 1. Setup
    conteudo_falso = b"Infectado"
    arquivo_memoria = BytesIO(conteudo_falso)
    upload_file = UploadFile(filename="virus.exe", file=arquivo_memoria)
    
    # 2. Ação Maliciosa: Forçamos o 'shutil.copyfileobj' a explodir simulando disco cheio
    with patch("app.utils.file_helper.UPLOAD_DIR", tmp_path):
        with patch("app.utils.file_helper.shutil.copyfileobj", side_effect=Exception("Disco Cheio Error")):
            
            # O Pytest espera que o erro seja lançado
            with pytest.raises(Exception) as exc_info:
                save_upload_file(upload_file, "lixeira")
            
            # 3. Validações do Rollback
            assert "Disco Cheio Error" in str(exc_info.value)
            
            # Garantir que a pasta alvo está VAZIA (o os.remove funcionou!)
            pasta_alvo = tmp_path / "lixeira"
            if pasta_alvo.exists():
                arquivos_na_pasta = list(pasta_alvo.iterdir())
                assert len(arquivos_na_pasta) == 0, "O helper deixou lixo para trás!"
                
            assert upload_file.file.closed is True # O finally rodou mesmo com erro