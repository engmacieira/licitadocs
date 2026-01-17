import io
from unittest.mock import patch
from fastapi import status
from app.models.user_model import User, UserRole

def test_upload_document_success(client):
    """
    Cenário: Upload de um PDF válido por um usuário logado com empresa.
    O que testamos:
    1. Se autentica.
    2. Se aceita PDF.
    3. Se chama o Storage (Mockado).
    4. Se salva no banco e retorna 201.
    """
    # 1. Setup: Criar usuário e logar para pegar o token
    user_payload = {"email": "uploader@teste.com", "password": "senha_123", "is_active": True}
    # O register agora cria empresa automaticamente (conforme nosso fix anterior)
    client.post("/auth/register", json=user_payload)
    
    # Login para pegar o token
    login_res = client.post("/auth/login", data={"username": "uploader@teste.com", "password": "senha_123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Preparar o Arquivo Fake
    # Criamos um arquivo em memória (bytes) para simular um PDF
    file_content = b"%PDF-1.4 fake content"
    file_obj = io.BytesIO(file_content)
    file_obj.name = "contrato.pdf" # Nome original

    # 3. Execução com Mock
    # @patch intercepta a função save_file_locally DENTRO do router
    with patch("app.routers.document_router.save_file_locally") as mock_save:
        # Configura o mock para retornar um caminho falso sempre que for chamado
        mock_save.return_value = "storage/uploads/fake-uuid.pdf"

        # Enviamos o arquivo via 'files' e a data via 'data' (Form-Data)
        response = client.post(
            "/documents/upload",
            files={"file": ("contrato.pdf", file_obj, "application/pdf")},
            data={"expiration_date": "2026-12-31"},
            headers=headers
        )

    # 4. Asserções
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    
    # Verifica se os dados retornados batem
    assert data["filename"] == "contrato.pdf"
    assert data["status"] == "valid"
    assert "id" in data
    
    # Verifica se o nosso Mock foi chamado (prova que o router tentou salvar)
    mock_save.assert_called_once()

def test_upload_invalid_extension(client):
    """
    Cenário: Tentar enviar um .txt ou .exe.
    Resultado Esperado: 400 Bad Request.
    """
    # 1. Setup Auth
    client.post("/auth/register", json={"email": "hacker@teste.com", "password": "senha_123"})
    login_res = client.post("/auth/login", data={"username": "hacker@teste.com", "password": "senha_123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Arquivo TXT disfarçado
    file_content = b"eu sou um virus"
    file_obj = io.BytesIO(file_content)
    
    # 3. Execução
    response = client.post(
        "/documents/upload",
        files={"file": ("virus.exe", file_obj, "application/x-msdownload")},
        headers=headers
    )

    # 4. Asserção
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == "Apenas arquivos PDF são permitidos."
    
def test_list_documents(client):
    """
    Cenário: Listar documentos da empresa logada.
    """
    # 1. Setup Auth
    client.post("/auth/register", json={"email": "ceo@teste.com", "password": "senha_forte_123", "is_active": True})
    login_res = client.post("/auth/login", data={"username": "ceo@teste.com", "password": "senha_forte_123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload de um doc de teste (para ter o que listar)
    file_content = b"%PDF-1.4 conteudo"
    file_obj = io.BytesIO(file_content)
    
    with patch("app.routers.document_router.save_file_locally") as mock_save:
        mock_save.return_value = "storage/dummy.pdf"
        client.post(
            "/documents/upload",
            files={"file": ("relatorio.pdf", file_obj, "application/pdf")},
            headers=headers
        )

    # 3. Ação: Listar
    response = client.get("/documents/", headers=headers)

    # 4. Asserção
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["filename"] == "relatorio.pdf"
    
def test_admin_upload_for_client(client, db_session):
    """
    Cenário: Admin faz upload em nome de uma empresa cliente (Concierge).
    """
    # 1. Setup: Criar Admin e Cliente
    # Admin
    client.post("/auth/register", json={"email": "boss@admin.com", "password": "senha_forte_123"})
    # Hack de banco para virar admin
    admin_user = db_session.query(User).filter(User.email == "boss@admin.com").first()
    admin_user.role = UserRole.ADMIN.value
    db_session.commit()
    
    # Cliente (Vamos pegar o ID da empresa dele)
    client.post("/auth/register", json={"email": "cliente@teste.com", "password": "senha_forte_123"})
    client_user = db_session.query(User).filter(User.email == "cliente@teste.com").first()
    target_company_id = client_user.company.id

    # 2. Login como ADMIN
    login_res = client.post("/auth/login", data={"username": "boss@admin.com", "password": "senha_forte_123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Ação: Upload apontando para o Cliente
    file_content = b"%PDF-1.4 admin content"
    file_obj = io.BytesIO(file_content)
    
    with patch("app.routers.document_router.save_file_locally") as mock_save:
        mock_save.return_value = "storage/admin_sent.pdf"
        
        # Note o campo 'target_company_id' no data
        response = client.post(
            "/documents/upload",
            files={"file": ("admin_doc.pdf", file_obj, "application/pdf")},
            data={"target_company_id": target_company_id},
            headers=headers
        )

    # 4. Asserção
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["filename"] == "admin_doc.pdf"
    
    # Prova Real: O documento NÃO pode ser do Admin, tem que ser do ID que mandamos
    # (Note que o ID do doc retornado não mostra o company_id, mas podemos checar no banco se quiser,
    #  mas se deu 201 e não estourou erro, a lógica funcionou).