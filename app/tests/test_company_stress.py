import pytest
from concurrent.futures import ThreadPoolExecutor
from fastapi import status
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import get_db
from app.tests.test_company_router import setup_company_and_user

def test_race_condition_convite_multiplo(db_session, client):
    """
    Teste de Estresse: Simula 10 requisições simultâneas tentando 
    convidar o MESMO usuário para a MESMA empresa.
    """
    # 1. Prepara o cenário
    company, user, token = setup_company_and_user(db_session)
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "email": "alvo_do_stress@teste.com",
        "role": "MASTER"
    }

    # 🛠️ A MÁGICA DA CONCORRÊNCIA:
    # Capturamos o motor do banco de dados (SQLite in-memory) e dizemos ao FastAPI
    # para criar uma sessão NOVA e isolada para cada thread, tal como acontece em Produção.
    engine = db_session.get_bind()
    TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db_concurrent():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()
            
    # Aplica a regra especial apenas para este teste
    app.dependency_overrides[get_db] = override_get_db_concurrent

    # 2. Define a função do ataque
    def disparar_convite():
        return client.post(f"/companies/{company.id}/members", json=payload, headers=headers)

    # 3. 🚀 ESTRESSE: Dispara 10 threads
    numero_de_ataques = 10
    
    with ThreadPoolExecutor(max_workers=numero_de_ataques) as executor:
        futures = [executor.submit(disparar_convite) for _ in range(numero_de_ataques)]
        responses = [f.result() for f in futures]

    # 4. Avalia os estragos
    sucessos = sum(1 for r in responses if r.status_code == status.HTTP_201_CREATED)
    erros_400 = sum(1 for r in responses if r.status_code == status.HTTP_400_BAD_REQUEST)
    erros_500 = sum(1 for r in responses if r.status_code >= 500)

    print(f"\n--- RESULTADO DO ESTRESSE ---")
    print(f"Sucessos (201): {sucessos}")
    print(f"Erros Previstos (400): {erros_400}")
    print(f"Erros de Banco (500): {erros_500}")

    # Restaura a configuração normal para não estragar os testes seguintes!
    app.dependency_overrides.pop(get_db, None)

    assert sucessos == 1, f"FALHA DE CONCORRÊNCIA! {sucessos} convites passaram ao mesmo tempo."
    assert erros_500 == 0, f"FALHA NO BANCO! {erros_500} requisições causaram Internal Server Error."