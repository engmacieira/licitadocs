import pytest
from fastapi import status
from app.tests.test_company_router import setup_company_and_user
from app.models.user_model import UserRole

def test_stress_upload_gigante(db_session, client):
    """
    Teste de Estresse de Payload: Tenta fazer upload de um arquivo
    propositalmente gigante (ex: 50MB) para garantir que o servidor 
    não entra em colapso e bloqueia graciosamente.
    """
    company, user, token = setup_company_and_user(db_session)
    
    # 🛡️ AJUSTE 1: Transformar o usuário do teste num ADMIN (bypass do 403)
    user.role = UserRole.ADMIN.value
    db_session.commit()
    
    headers = {"Authorization": f"Bearer {token}"}
    
    tamanho_mb = 50
    arquivo_gigante = b"0" * (tamanho_mb * 1024 * 1024) 
    
    files = {
        "file": ("certidao_gigante.pdf", arquivo_gigante, "application/pdf")
    }
    
    # 🛡️ AJUSTE 2: Usar o nome correto do campo esperado pelo backend
    data = {
        "title": "Documento Muito Pesado",
        "target_company_id": str(company.id) 
    }

    print(f"\n[ESTRESSE] Disparando payload de {tamanho_mb}MB para o servidor...")

    # 🛡️ AJUSTE 3: A rota correta do FastAPI
    rota_upload = "/documents/upload" 
    
    response = client.post(rota_upload, headers=headers, files=files, data=data)

    print(f"[RESULTADO] Status retornado: {response.status_code}")
    if response.status_code < 500:
        print(f"[RESULTADO] Resposta da API: {response.text}")

    # 🔍 ASSERTIVAS ATUALIZADAS
    assert response.status_code in [
        status.HTTP_413_CONTENT_TOO_LARGE, 
        status.HTTP_400_BAD_REQUEST, 
        status.HTTP_422_UNPROCESSABLE_CONTENT
    ], f"FALHA! A API aceitou arquivo de {tamanho_mb}MB ou deu Erro Interno. Status: {response.status_code}"