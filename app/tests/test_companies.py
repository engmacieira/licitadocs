from app.core.security import get_password_hash
from app.models.user_model import User, UserRole
from app.models.company_model import Company

# --- Helpers (Funções Auxiliares para o Teste) ---
def create_admin_and_get_token(client, db):
    """Cria um admin no banco temporário e retorna o token de acesso."""
    password = "adminpass"
    existing = db.query(User).filter(User.email == "admin@test.com").first()
    if not existing:
        admin = User(
            email="admin@test.com",
            role=UserRole.ADMIN.value,
            password_hash=get_password_hash(password)
        )
        db.add(admin)
        db.commit()
    
    # Faz login para pegar o token
    response = client.post("/auth/token", data={"username": "admin@test.com", "password": password})
    if response.status_code != 200:
        raise ValueError(f"Falha no Login Admin: {response.json()}")
        
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def create_normal_user_and_get_token(client, db):
    """Cria um usuário comum para testar permissões."""
    password = "userpass"
    existing = db.query(User).filter(User.email == "user@test.com").first()
    if not existing:
        user = User(
            email="user@test.com",
            role=UserRole.CLIENT.value, # <--- Cliente Comum
            password_hash=get_password_hash(password)
        )
        db.add(user)
    db.commit()
    
    response = client.post("/auth/token", data={"username": "user@test.com", "password": password})
    
    if response.status_code != 200:
        raise ValueError(f"Falha no Login User: {response.json()}")

    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# --- Casos de Teste (Test Cases) ---

def test_create_company_success(client, db_session):
    # 1. Arrange (Preparação)
    headers = create_admin_and_get_token(client, db_session)
    payload = {
        "razao_social": "Construtora Aço Forte",
        "cnpj": "12345678000199",
        "nome_fantasia": "Aço Forte"
    }

    # 2. Act (Ação)
    response = client.post("/admin/companies", json=payload, headers=headers)

    # 3. Assert (Verificação)
    assert response.status_code == 201
    data = response.json()
    assert data["razao_social"] == payload["razao_social"]
    assert data["cnpj"] == payload["cnpj"]
    assert "id" in data

def test_create_company_duplicate_cnpj_should_fail(client, db_session):
    # 1. Arrange
    headers = create_admin_and_get_token(client, db_session)
    payload = {"razao_social": "Empresa A", "cnpj": "11122233000100"}
    
    # Cria a primeira vez (Sucesso)
    client.post("/admin/companies", json=payload, headers=headers)

    # 2. Act - Tenta criar a segunda (Mesmo CNPJ)
    payload_dup = {"razao_social": "Empresa B", "cnpj": "11122233000100"}
    response = client.post("/admin/companies", json=payload_dup, headers=headers)

    # 3. Assert
    assert response.status_code == 400
    assert "Já existe uma empresa" in response.json()["detail"]

def test_list_companies(client, db_session):
    headers = create_admin_and_get_token(client, db_session)
    
    # Popula o banco
    client.post("/admin/companies", json={"razao_social": "Empresa 1", "cnpj": "10000000000100", "nome_fantasia": "Empresa 1"}, headers=headers)
    client.post("/admin/companies", json={"razao_social": "Empresa 2", "cnpj": "20000000000200", "nome_fantasia": "Empresa 2"}, headers=headers)

    # Busca
    response = client.get("/admin/companies", headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2

def test_security_only_admin_can_create_company(client, db_session):
    # Tenta com usuário comum
    normal_headers = create_normal_user_and_get_token(client, db_session)
    response = client.post(
        "/admin/companies", 
        json={"razao_social": "Hacker Corp", "cnpj": "00000000000000"}, 
        headers=normal_headers
    )
    
    # Deve ser proibido (403)
    assert response.status_code == 403

def test_update_company(client, db_session):
    headers = create_admin_and_get_token(client, db_session)
    
    # Cria
    create_resp = client.post("/admin/companies", json={"razao_social": "Antiga", "cnpj": "99999999000999", "nome_fantasia": "Antiga"}, headers=headers)
    company_id = create_resp.json()["id"]

    # Atualiza
    update_payload = {"razao_social": "Nova Razão Social", "nome_fantasia": "Nova Razão Social"}
    response = client.put(f"/admin/companies/{company_id}", json=update_payload, headers=headers)

    assert response.status_code == 200
    assert response.json()["razao_social"] == "Nova Razão Social"