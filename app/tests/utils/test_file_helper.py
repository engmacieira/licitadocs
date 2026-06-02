import pytest
from unittest.mock import MagicMock, AsyncMock
from fastapi import UploadFile
from app.utils.file_helper import save_upload_file, delete_file, get_file_url
import app.utils.file_helper

@pytest.fixture
def mock_supabase():
    original_supabase = app.utils.file_helper.supabase
    mock_client = MagicMock()
    app.utils.file_helper.supabase = mock_client
    yield mock_client
    app.utils.file_helper.supabase = original_supabase

@pytest.mark.asyncio
async def test_save_upload_file(mock_supabase):
    """Verify upload file is correctly uploaded to Supabase Storage."""
    # Mocking UploadFile
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "test_document.pdf"
    mock_file.content_type = "application/pdf"
    mock_file.read = AsyncMock(return_value=b"conteudo do arquivo")
    mock_file.close = AsyncMock()

    # Mocking Supabase storage upload
    mock_upload = MagicMock()
    mock_supabase.storage.from_.return_value.upload = mock_upload

    # Call save_upload_file
    storage_path, size = await save_upload_file(mock_file, "vault")

    # Assertions
    assert storage_path.startswith("vault/")
    assert storage_path.endswith(".pdf")
    assert size == len(b"conteudo do arquivo")
    
    mock_file.read.assert_called_once()
    mock_file.close.assert_called_once()
    mock_supabase.storage.from_.assert_called_once_with("vault")
    
    # Verify upload parameters
    called_kwargs = mock_upload.call_args[1]
    assert called_kwargs["file"] == b"conteudo do arquivo"
    assert called_kwargs["file_options"] == {"content-type": "application/pdf"}

def test_delete_file(mock_supabase):
    """Verify file deletion invokes Supabase Storage delete."""
    # Mocking Supabase storage remove
    mock_remove = MagicMock()
    mock_supabase.storage.from_.return_value.remove = mock_remove

    # Call delete_file
    delete_file("vault/test_file.pdf")

    # Assertions
    mock_supabase.storage.from_.assert_called_once_with("vault")
    mock_remove.assert_called_once_with(["test_file.pdf"])

def test_delete_invalid_file_path(mock_supabase):
    """Verify deleting file with invalid path does not call Supabase."""
    delete_file("invalid_path")

    # Should do nothing and not call supabase
    mock_supabase.storage.from_.assert_not_called()

@pytest.mark.asyncio
async def test_get_file_url(mock_supabase):
    """Verify generating signed URL uses Supabase SDK."""
    # Mocking Supabase signed URL generation
    mock_create_signed_url = MagicMock(return_value={'signedURL': 'http://signed-url-placeholder'})
    mock_supabase.storage.from_.return_value.create_signed_url = mock_create_signed_url

    # Call get_file_url
    url = await get_file_url("vault/test_file.pdf", expires_in=1800)

    # Assertions
    assert url == "http://signed-url-placeholder"
    mock_supabase.storage.from_.assert_called_once_with("vault")
    mock_create_signed_url.assert_called_once_with("test_file.pdf", 1800)

@pytest.mark.asyncio
async def test_get_file_url_exception(mock_supabase):
    """Verify generating signed URL returns empty string on exception."""
    # Simulate an exception in create_signed_url
    mock_supabase.storage.from_.side_effect = Exception("Supabase error")

    # Call get_file_url
    url = await get_file_url("vault/test_file.pdf")

    # Assertions
    assert url == ""
