import pytest
from datetime import datetime, timezone
from app.repositories.audit_repository import AuditRepository
from app.models.audit_log_model import AuditLog

def test_create_audit_log_async(db_session, test_user):
    db_session.query(AuditLog).delete()
    db_session.commit()

    AuditRepository.create_audit_log_async(
        entity_name="TestEntity",
        entity_id="123",
        action="CREATE",
        user_id=test_user.id,
        old_payload={"a": 1},
        new_payload={"b": 2},
        request_id="req-123"
    )

    logs = db_session.query(AuditLog).all()
    assert len(logs) == 1
    assert logs[0].entity_name == "TestEntity"

def test_get_audit_logs_filters(db_session, test_user):
    db_session.query(AuditLog).delete()
    db_session.commit()

    log1 = AuditLog(entity_name="EntityA", entity_id="1", action="CREATE", user_id=test_user.id, request_id="req-1")
    db_session.add(log1)
    db_session.commit()

    logs, total = AuditRepository.get_audit_logs(db_session, entity_name="EntityA")
    assert total == 1

def test_create_audit_log_async_exception(monkeypatch):
    import structlog
    class MockSession:
        def __init__(self): pass
        def add(self, *args, **kwargs): raise Exception("Simulated Error")
        def commit(self): pass
        def rollback(self): self.rollback_called = True
        def close(self): self.close_called = True

    mock_session = MockSession()
    monkeypatch.setattr("app.repositories.audit_repository.SessionLocal", lambda: mock_session)
    mock_logger = structlog.get_logger("test_logger")
    monkeypatch.setattr("app.repositories.audit_repository.logger", mock_logger)

    AuditRepository.create_audit_log_async(
        entity_name="TestEntity", entity_id="123", action="CREATE",
        user_id="user-1", old_payload={}, new_payload={}, request_id="req-1"
    )
    assert mock_session.rollback_called is True
