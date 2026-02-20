import { describe, it, expect, vi, beforeEach } from 'vitest';
import { companyService } from './companyService';
import api from './api';

// ==========================================
// 🎭 MOCKING DO AXIOS (Instância da API)
// ==========================================
vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        put: vi.fn(),
        post: vi.fn(),
    }
}));

describe('companyService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getTeam()', () => {
        it('deve buscar os membros da equipe montando a URL corretamente', async () => {
            const mockMembers = [
                { user_id: 'u1', name: 'João', email: 'joao@teste.com', role: 'MASTER', status: true, joined_at: '2023-01-01' }
            ];
            (api.get as any).mockResolvedValueOnce({ data: mockMembers });

            const result = await companyService.getTeam('empresa-123');

            // Verifica se a string de template montou a URL certa
            expect(api.get).toHaveBeenCalledWith('/companies/empresa-123/members');
            expect(result).toEqual(mockMembers);
        });
    });

    describe('update()', () => {
        it('deve enviar um PUT com o payload para atualizar a empresa', async () => {
            const mockPayload = { razao_social: 'Nova Razão Social LTDA', telefone: '11999999999' };
            const mockCompanyResponse = { id: 'empresa-123', razao_social: 'Nova Razão Social LTDA', is_active: true };

            (api.put as any).mockResolvedValueOnce({ data: mockCompanyResponse });

            const result = await companyService.update('empresa-123', mockPayload);

            // Verifica URL, Payload e o Verbo HTTP (PUT)
            expect(api.put).toHaveBeenCalledWith('/companies/empresa-123', mockPayload);
            expect(result).toEqual(mockCompanyResponse);
        });

        it('deve repassar o erro se a atualização falhar', async () => {
            const mockError = new Error('Erro ao atualizar');
            (api.put as any).mockRejectedValueOnce(mockError);

            await expect(companyService.update('empresa-123', {})).rejects.toThrow('Erro ao atualizar');
        });
    });

    describe('inviteMember()', () => {
        it('deve enviar um POST com o email e a role para convidar o membro', async () => {
            const mockPayload = { email: 'novo@teste.com', role: 'VIEWER' as const };
            const mockResponse = { user_id: 'u2', email: 'novo@teste.com', role: 'VIEWER', message: 'Convite enviado' };

            (api.post as any).mockResolvedValueOnce({ data: mockResponse });

            const result = await companyService.inviteMember('empresa-123', mockPayload);

            expect(api.post).toHaveBeenCalledWith('/companies/empresa-123/members', mockPayload);
            expect(result).toEqual(mockResponse);
        });
    });

    describe('getAll()', () => {
        it('deve buscar todas as empresas', async () => {
            const mockCompanies = [{ id: '1', razao_social: 'Matriz' }];
            (api.get as any).mockResolvedValueOnce({ data: mockCompanies });

            const result = await companyService.getAll();

            expect(api.get).toHaveBeenCalledWith('/companies');
            expect(result).toEqual(mockCompanies);
        });
    });

    describe('getById()', () => {
        it('deve buscar uma empresa específica pelo ID', async () => {
            const mockCompany = { id: 'empresa-777', razao_social: 'Filial' };
            (api.get as any).mockResolvedValueOnce({ data: mockCompany });

            const result = await companyService.getById('empresa-777');

            expect(api.get).toHaveBeenCalledWith('/companies/empresa-777');
            expect(result).toEqual(mockCompany);
        });
    });
});