"""
Testes de Integração de Rotas: Portal de Prefeituras.
Garante as permissões de acesso (RBAC) onde o Admin tem acesso de escrita
e o Cliente apenas acesso de leitura.
"""
import random
import string
from fastapi import status

from app.models.user_model import User, UserRole
from app.core.security import get_password_hash, create_access_token

# ==========================================
# 🛠️ HELPER: FÁBRICA DE UTILIZADORES
# ==========================================

def setup_user_by_role(db_session, role: str):
    """Cria um utilizador genérico com a permissão desejada para os testes."""
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    user = User(
        email=f"{role}_user_{suffix}@teste.com",
        password_hash=get_password_hash("123"),
        role=role,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    
    token = create_access_token({"sub": user.email})
    return user, token

# ==========================================
# 🧪 TESTES DE CRIAÇÃO E SEGURANÇA
# ==========================================

def test_create_prefecture_success(db_session, client):
    """Cenário: Administrador cadastra uma nova prefeitura com sucesso."""
    admin_user, token = setup_user_by_role(db_session, UserRole.ADMIN.value)
    
    payload = {
        "state": "SP",
        "city": "São Paulo",
        "emission_link": "https://sp.gov.br",
        "contact_email": "contato@sp.gov.br"
    }
    
    response = client.post(
        "/prefectures/", 
        json=payload, 
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["city"] == "São Paulo"
    assert data["state"] == "SP"
    assert "id" in data

def test_create_prefecture_forbidden(db_session, client):
    """Cenário de Segurança: Cliente comum tenta cadastrar prefeitura e é bloqueado."""
    client_user, token = setup_user_by_role(db_session, UserRole.CLIENT.value)
    
    payload = {"state": "RJ", "city": "Rio de Janeiro"}
    
    response = client.post(
        "/prefectures/", 
        json=payload, 
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Deve retornar Forbidden (403) devido ao require_role
    assert response.status_code == status.HTTP_403_FORBIDDEN

# ==========================================
# 🧪 TESTES DE LEITURA E ATUALIZAÇÃO
# ==========================================

def test_list_prefectures_success(db_session, client):
    """Cenário: Cliente comum lista as prefeituras sem problemas."""
    # 1. Admin cria a prefeitura
    admin_user, admin_token = setup_user_by_role(db_session, UserRole.ADMIN.value)
    client.post(
        "/prefectures/", 
        json={"state": "MG", "city": "Belo Horizonte"}, 
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    # 2. Cliente comum (com token diferente) faz o GET
    client_user, client_token = setup_user_by_role(db_session, UserRole.CLIENT.value)
    response = client.get(
        "/prefectures/", 
        headers={"Authorization": f"Bearer {client_token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) >= 1
    
    # Verifica se a prefeitura de MG está na lista retornada
    cidades = [pref["city"] for pref in response.json()]
    assert "Belo Horizonte" in cidades

def test_update_prefecture_success(db_session, client):
    """Cenário: Administrador atualiza o WhatsApp de contacto de uma prefeitura."""
    admin_user, token = setup_user_by_role(db_session, UserRole.ADMIN.value)
    
    # 1. Cria a prefeitura
    create_resp = client.post(
        "/prefectures/", 
        json={"state": "BA", "city": "Salvador"}, 
        headers={"Authorization": f"Bearer {token}"}
    )
    pref_id = create_resp.json()["id"]
    
    # 2. Atualiza
    response = client.put(
        f"/prefectures/{pref_id}", 
        json={"contact_whatsapp": "11999999999"}, 
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["contact_whatsapp"] == "11999999999"

def test_delete_prefecture_success(db_session, client):
    """Cenário: Administrador apaga uma prefeitura."""
    admin_user, token = setup_user_by_role(db_session, UserRole.ADMIN.value)
    
    # 1. Cria a prefeitura
    create_resp = client.post(
        "/prefectures/", 
        json={"state": "PR", "city": "Curitiba"}, 
        headers={"Authorization": f"Bearer {token}"}
    )
    pref_id = create_resp.json()["id"]
    
    # 2. Apaga
    response = client.delete(
        f"/prefectures/{pref_id}", 
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == status.HTTP_204_NO_CONTENT