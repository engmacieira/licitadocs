import { describe, it, expect, vi, beforeEach } from 'vitest';
import { documentService } from './documentService';
import api from './api';

// ==========================================
// 🎭 MOCKING DO AXIOS E GLOBAIS DO DOM
// ==========================================
vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    }
}));

describe('documentService', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Mock das funções de URL do navegador para o teste de download
        window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
        window.URL.revokeObjectURL = vi.fn();

        // Mock do document.createElement para capturar o clique do download
        document.createElement = vi.fn().mockReturnValue({
            setAttribute: vi.fn(),
            click: vi.fn(),
            remove: vi.fn(),
            href: ''
        });
        document.body.appendChild = vi.fn();
    });

    describe('getTypes()', () => {
        it('deve buscar o catálogo completo de categorias e tipos', async () => {
            const mockCatalog = [{ id: 'cat-1', name: 'Legal', types: [] }];
            (api.get as any).mockResolvedValueOnce({ data: mockCatalog });

            const result = await documentService.getTypes();

            expect(api.get).toHaveBeenCalledWith('/documents/types');
            expect(result).toEqual(mockCatalog);
        });
    });

    describe('getAll()', () => {
        it('deve buscar documentos gerais quando nenhum ID de empresa é fornecido', async () => {
            (api.get as any).mockResolvedValueOnce({ data: [] });
            await documentService.getAll();
            expect(api.get).toHaveBeenCalledWith('/documents/');
        });

        it('deve incluir company_id na query string quando fornecido (visão Admin)', async () => {
            (api.get as any).mockResolvedValueOnce({ data: [] });
            await documentService.getAll('empresa-xyz');
            expect(api.get).toHaveBeenCalledWith('/documents/?company_id=empresa-xyz');
        });
    });

    describe('upload()', () => {
        it('deve construir o FormData corretamente com campos opcionais da Sprint 17', async () => {
            const mockFile = new File(['conteudo'], 'teste.pdf', { type: 'application/pdf' });
            const mockResponse = { id: 'doc-123', filename: 'teste.pdf' };
            (api.post as any).mockResolvedValueOnce({ data: mockResponse });

            const options = {
                title: 'Meu Documento',
                typeId: 'tipo-alpha',
                authenticationCode: 'AUTH-999',
                expirationDate: '2030-01-01'
            };

            const result = await documentService.upload(mockFile, 'emp-1', options);

            // Capturamos o FormData enviado para o api.post
            const [url, formData] = (api.post as any).mock.calls[0];

            expect(url).toBe('/documents/upload');
            expect(formData).toBeInstanceOf(FormData);
            expect(formData.get('file')).toEqual(mockFile);
            expect(formData.get('target_company_id')).toBe('emp-1');
            expect(formData.get('title')).toBe('Meu Documento');
            expect(formData.get('type_id')).toBe('tipo-alpha');
            expect(formData.get('authentication_code')).toBe('AUTH-999');
            expect(formData.get('expiration_date')).toBe('2030-01-01');

            expect(result).toEqual(mockResponse);
        });
    });

    describe('downloadDocument()', () => {
        it('deve disparar o fluxo de download nativo do navegador', async () => {
            const mockBlob = new Blob(['data'], { type: 'application/pdf' });
            (api.get as any).mockResolvedValueOnce({ data: mockBlob });

            await documentService.downloadDocument('doc-id', 'meu-arquivo.pdf');

            // Verifica se buscou o blob da API
            expect(api.get).toHaveBeenCalledWith('/documents/doc-id/download', {
                responseType: 'blob'
            });

            // Verifica se criou o link temporário no DOM
            expect(window.URL.createObjectURL).toHaveBeenCalled();
            expect(document.createElement).toHaveBeenCalledWith('a');

            // Verifica se limpou a memória após o "clique"
            expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
        });
    });

    describe('CRUD de Categorias e Tipos', () => {
        it('deve realizar a criação de uma categoria', async () => {
            const payload = { name: 'Finanças', slug: 'financas', order: 1 };
            (api.post as any).mockResolvedValueOnce({ data: { id: 'new-cat', ...payload } });

            await documentService.createCategory(payload);
            expect(api.post).toHaveBeenCalledWith('/documents/categories', payload);
        });

        it('deve realizar a exclusão de um tipo', async () => {
            (api.delete as any).mockResolvedValueOnce({});
            await documentService.deleteType('type-id');
            expect(api.delete).toHaveBeenCalledWith('/documents/types/type-id');
        });
    });
});