from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any, Dict
from datetime import datetime
from uuid import UUID

class AuditLogResponse(BaseModel):
    id: UUID
    entity_name: str
    entity_id: str
    action: str
    user_id: Optional[str] = None
    old_payload: Optional[Dict[str, Any]] = None
    new_payload: Optional[Dict[str, Any]] = None
    created_at: datetime
    request_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class PaginatedAuditLogs(BaseModel):
    items: List[AuditLogResponse]
    total: int
    skip: int
    limit: int
