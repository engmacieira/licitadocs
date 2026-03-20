import pytest
from unittest.mock import patch, MagicMock, mock_open
from app.services.crawlers.fgts_crawler_v1 import FGTSCrawlerV1

@pytest.fixture
def crawler():
    return FGTSCrawlerV1({"cnpj": "12.345.678/0001-90"})

@patch("app.services.crawlers.fgts_crawler_v1.sync_playwright")
def test_fgts_crawler_happy_path(mock_playwright, crawler):
    # Setup complex Playwright mock chain
    mock_p = mock_playwright.return_value.__enter__.return_value
    mock_browser = mock_p.chromium.launch.return_value
    mock_context = mock_browser.new_context.return_value
    mock_page = mock_context.new_page.return_value
    
    mock_download = MagicMock()
    mock_download.path.return_value = "/tmp/test.pdf"
    
    # Mocking the context manager for expect_download
    mock_expect_download = mock_page.expect_download.return_value
    mock_expect_download.__enter__.return_value = MagicMock(value=mock_download)
    
    # Mock file read
    m_open = mock_open(read_data=b"%PDF-fgts-content")
    
    with patch("app.services.crawlers.fgts_crawler_v1.open", m_open):
        result = crawler.fetch()
    
    assert result["success"] is True
    assert result["file_content"] == b"%PDF-fgts-content"
    assert "crf_fgts_12345678000190.pdf" == result["file_metadata"]["filename"]

@patch("app.services.crawlers.fgts_crawler_v1.sync_playwright")
def test_fgts_crawler_site_timeout(mock_playwright, crawler):
    from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
    
    mock_p = mock_playwright.return_value.__enter__.return_value
    mock_browser = mock_p.chromium.launch.return_value
    mock_context = mock_browser.new_context.return_value
    mock_page = mock_context.new_page.return_value
    
    # Simulate timeout on wait_for
    mock_page.locator.return_value.first.wait_for.side_effect = PlaywrightTimeoutError("Timeout")
    
    result = crawler.fetch()
    assert result["success"] is False
    assert "não carregou o campo" in result["message"]

@patch("app.services.crawlers.fgts_crawler_v1.sync_playwright")
def test_fgts_crawler_no_regularity(mock_playwright, crawler):
    from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
    
    mock_p = mock_playwright.return_value.__enter__.return_value
    mock_browser = mock_p.chromium.launch.return_value
    mock_context = mock_browser.new_context.return_value
    mock_page = mock_context.new_page.return_value
    
    # Simulate timeout on "Obter Certidão" button
    mock_page.get_by_role.return_value.wait_for.side_effect = PlaywrightTimeoutError("Timeout")
    
    result = crawler.fetch()
    assert result["success"] is False
    assert "Empresa com pendências" in result["message"]
