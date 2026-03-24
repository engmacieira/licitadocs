import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { documentService } from './documentService';
import api from './api';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
    },
}));

describe('documentService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup for download test
        window.URL.createObjectURL = vi.fn(() => 'blob:url');
        window.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('getTypes should call api.get correctly', async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
        await documentService.getTypes();
        expect(api.get).toHaveBeenCalledWith('/documents/types');
    });

    it('getAll should handle companyId query param', async () => {
        vi.mocked(api.get).mockResolvedValue({ data: [] });
        
        await documentService.getAll('comp-1');
        expect(api.get).toHaveBeenCalledWith('/documents/?company_id=comp-1');

        await documentService.getAll();
        expect(api.get).toHaveBeenCalledWith('/documents/');
    });

    it('upload should send FormData with all possible options', async () => {
        vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'doc-1' } });
        const mockFile = new File([''], 'test.pdf', { type: 'application/pdf' });
        
        const options = {
            title: 'Test Doc',
            typeId: 'type-1',
            authenticationCode: 'AUTH123',
            expirationDate: '2023-12-31',
            status: 'valid',
            notes: 'Some notes'
        };

        await documentService.upload(mockFile, 'comp-1', options);

        const formData = vi.mocked(api.post).mock.calls[0][1] as FormData;
        expect(formData.get('file')).toBe(mockFile);
        expect(formData.get('target_company_id')).toBe('comp-1');
        expect(formData.get('title')).toBe('Test Doc');
        expect(formData.get('authentication_code')).toBe('AUTH123');
        expect(formData.get('expiration_date')).toBe('2023-12-31');
        expect(formData.get('status')).toBe('valid');
        expect(formData.get('notes')).toBe('Some notes');
    });

    it('upload should work without a file or options', async () => {
        vi.mocked(api.post).mockResolvedValueOnce({ data: { id: 'doc-1' } });
        await documentService.upload(null, 'comp-1');
        const formData = vi.mocked(api.post).mock.calls[0][1] as FormData;
        expect(formData.get('file')).toBeNull();
        expect(formData.get('target_company_id')).toBe('comp-1');
    });

    it('downloadDocument should trigger a download in the browser', async () => {
        const mockBlob = new Blob(['content'], { type: 'text/plain' });
        vi.mocked(api.get).mockResolvedValueOnce({ data: mockBlob });

        // Spy on DOM methods
        const link = document.createElement('a');
        const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => link);
        const clickSpy = vi.spyOn(link, 'click').mockImplementation(() => {});
        const removeSpy = vi.spyOn(link, 'remove').mockImplementation(() => {});
        const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(link);

        await documentService.downloadDocument('doc-1', 'test_file.txt');

        expect(api.get).toHaveBeenCalledWith('/documents/doc-1/download', { responseType: 'blob' });
        expect(window.URL.createObjectURL).toHaveBeenCalled();
        expect(createElementSpy).toHaveBeenCalledWith('a');
        expect(appendSpy).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();
        expect(removeSpy).toHaveBeenCalled();
        expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');

        createElementSpy.mockRestore();
        appendSpy.mockRestore();
    });

    it('create/update/delete category should call correct endpoints', async () => {
        vi.mocked(api.post).mockResolvedValueOnce({ data: {} });
        await documentService.createCategory({ name: 'C', slug: 's', order: 1 });
        expect(api.post).toHaveBeenCalledWith('/documents/categories', expect.any(Object));

        vi.mocked(api.put).mockResolvedValueOnce({ data: {} });
        await documentService.updateCategory('1', { name: 'N' });
        expect(api.put).toHaveBeenCalledWith('/documents/categories/1', { name: 'N' });

        vi.mocked(api.delete).mockResolvedValueOnce({});
        await documentService.deleteCategory('1');
        expect(api.delete).toHaveBeenCalledWith('/documents/categories/1');
    });

    it('create/update/delete type should call correct endpoints', async () => {
        vi.mocked(api.post).mockResolvedValueOnce({ data: {} });
        await documentService.createType({ name: 'T', slug: 's', validity_days_default: 30, category_id: '1', scope: 'NATIONAL' });
        expect(api.post).toHaveBeenCalledWith('/documents/types', expect.any(Object));

        vi.mocked(api.put).mockResolvedValueOnce({ data: {} });
        await documentService.updateType('1', { name: 'N' });
        expect(api.put).toHaveBeenCalledWith('/documents/types/1', { name: 'N' });

        vi.mocked(api.delete).mockResolvedValueOnce({});
        await documentService.deleteType('1');
        expect(api.delete).toHaveBeenCalledWith('/documents/types/1');
    });

    it('monitoring methods should call correct endpoints', async () => {
        vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
        await documentService.getExpiring(10);
        expect(api.get).toHaveBeenCalledWith('/documents/expiring?days=10');

        vi.mocked(api.get).mockResolvedValueOnce({ data: [] });
        await documentService.getIrregular();
        expect(api.get).toHaveBeenCalledWith('/documents/irregular');
    });

    it('deleteDocument/updateDocument should call correct endpoints', async () => {
        vi.mocked(api.delete).mockResolvedValueOnce({});
        await documentService.deleteDocument('1');
        expect(api.delete).toHaveBeenCalledWith('/documents/1');

        vi.mocked(api.patch).mockResolvedValueOnce({});
        await documentService.updateDocument('1', { status: 'archived' });
        expect(api.patch).toHaveBeenCalledWith('/documents/1', { status: 'archived' });
    });
});
