import pytest
import re
from pydantic import ValidationError
from sqlalchemy.orm import Session

# --- Helpers de Geração de Dados ---

def generate_valid_cpf():
    """Gera um CPF válido para testes (Algoritmo Real)."""
    import random
    def calculate_dv(digits):
        weight = len(digits) + 1
        s = sum(d * (weight - i) for i, d in enumerate(digits))
        resto = s % 11
        return 0 if resto < 2 else 11 - resto

    digits = [random.randint(0, 9) for _ in range(9)]
    dv1 = calculate_dv(digits)
    digits.append(dv1)
    dv2 = calculate_dv(digits)
    digits.append(dv2)
    return "".join(map(str, digits))

def generate_valid_cnpj():
    """Gera um CNPJ válido para testes (Algoritmo Real)."""
    import random
    def calculate_dv(digits, weights):
        s = sum(d * w for d, w in zip(digits, weights))
        resto = s % 11
        return 0 if resto < 2 else 11 - resto

    digits = [random.randint(0, 9) for _ in range(8)] + [0, 0, 0, 1]
    dv1 = calculate_dv(digits, [5,4,3,2,9,8,7,6,5,4,3,2])
    digits.append(dv1)
    dv2 = calculate_dv(digits, [6,5,4,3,2,9,8,7,6,5,4,3,2])
    digits.append(dv2)
    return "".join(map(str, digits))

# --- Fixtures Reutilizáveis ---

@pytest.fixture
def cpf_valido():
    return generate_valid_cpf()

@pytest.fixture
def cnpj_valido():
    return generate_valid_cnpj()

@pytest.fixture
def schema_tester():
    """Utilitário para testar schemas Pydantic de forma DRY."""
    class Tester:
        @staticmethod
        def assert_validation_error(model_cls, data, field=None, msg_fragment=None):
            with pytest.raises(ValidationError) as exc:
                model_cls(**data)
            if field:
                assert any(field in error['loc'] for error in exc.value.errors()), f"Campo {field} não encontrado no erro"
            if msg_fragment:
                assert msg_fragment in str(exc.value), f"Mensagem '{msg_fragment}' não encontrada no erro"
            return exc.value

        @staticmethod
        def persist_and_verify(db: Session, model_cls, schema_instance, extra_fields=None):
            """
            Tenta persistir os dados do schema num model SQL e verifica sucesso.
            """
            # 1. Usa by_alias=True para converter 'name' em 'razao_social'
            data = schema_instance.model_dump(by_alias=True)
            
            # 2. Mapeamentos Específicos
            if 'password' in data:
                data['password_hash'] = data.pop('password')
            
            # 3. Injeção de campos extras
            if extra_fields:
                data.update(extra_fields)

            # 4. Limpeza: Remove deleted_at para evitar duplicidade no INSERT 
            # e garante que apenas campos do model sejam passados.
            model_fields = {c.name for c in model_cls.__table__.columns}
            persistence_data = {
                k: v for k, v in data.items() 
                if k in model_fields and k != 'deleted_at'
            }
            
            instance = model_cls(**persistence_data)
            db.add(instance)
            db.commit()
            db.refresh(instance)
            return instance

    return Tester()
