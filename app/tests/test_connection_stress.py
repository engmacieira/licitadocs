import pytest
from concurrent.futures import ThreadPoolExecutor
from fastapi import status
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import get_db
from app.models.user_model import User, UserRole
from app.core.security import get_password_hash

def test_stress_connection_pool_login(db_session, client):
    """
    Teste de Estresse de Conexões: Simula um pico extremo de acessos
    onde 50 usuários tentam fazer login exatamente no mesmo milissegundo.
    O objetivo é testar se o SQLAlchemy/Postgres gerencia a fila (Pool)
    sem explodir com 'TimeoutError'.
    """
    # 1. Prepara o cenário: Criamos um usuário válido para o teste
    email_teste = "alvo_ddos@teste.com"
    senha_teste = "senha_super_secreta"
    
    user = User(
        email=email_teste,
        password_hash=get_password_hash(senha_teste),
        role=UserRole.CLIENT.value,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    # Payload de Login (Padrão OAuth2 do FastAPI)
    payload = {
        "username": email_teste,
        "password": senha_teste
    }

    # 🛠️ A MÁGICA DA CONCORRÊNCIA (Isolamento de Sessão com Postgres)
    engine = db_session.get_bind()
    TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db_concurrent():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()
            
    app.dependency_overrides[get_db] = override_get_db_concurrent

    # 2. Define a função do ataque (Bate na rota de token/login)
    def disparar_login():
        # Adapte a rota "/auth/token" ou "/auth/login" conforme o seu sistema
        return client.post("/auth/token", data=payload) 

    # 3. 🚀 ESTRESSE: Dispara 50 logins simultâneos (Acima do limite padrão do SQLAlchemy)
    numero_de_ataques = 50
    
    with ThreadPoolExecutor(max_workers=numero_de_ataques) as executor:
        futures = [executor.submit(disparar_login) for _ in range(numero_de_ataques)]
        responses = [f.result() for f in futures]

    # 4. Avalia os estragos
    sucessos_200 = sum(1 for r in responses if r.status_code == status.HTTP_200_OK)
    erros_429 = sum(1 for r in responses if r.status_code == 429) # Too Many Requests (Rate Limit)
    erros_500 = sum(1 for r in responses if r.status_code >= 500)

    print(f"\n--- RESULTADO DO PICO DE ACESSO ({numero_de_ataques} requisições) ---")
    print(f"Logins com Sucesso (200): {sucessos_200}")
    print(f"Bloqueados por Rate Limit (429): {erros_429}")
    print(f"Erros de Conexão/Banco (500): {erros_500}")

    app.dependency_overrides.pop(get_db, None)

    # 🔍 ASSERTIVAS DE RESILIÊNCIA:
    # Num sistema resiliente, ou TODAS passam (gerenciamento de fila do banco funcionou),
    # ou algumas são bloqueadas amigavelmente por Rate Limiter (429).
    # NENHUMA pode dar Erro 500 (Internal Server Error) por queda de conexão.
    assert erros_500 == 0, f"O SERVIDOR CAIU! {erros_500} requisições estouraram o limite de conexões do banco."