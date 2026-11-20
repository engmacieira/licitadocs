import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pncpLeadService } from './pncpLeadService';
import api from './api';
import type {
    PncpLeadContactResponse,
    PncpLeadListResponse,
    PncpLeadResponse,
    PncpLeadSyncResponse,
} from '../types';

vi.mock('./api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

const mockLead: PncpLeadResponse = {
    id: 'lead-1',
    cnpj: '12345678000195',
    razao_social: 'Fornecedor Exemplo Ltda',
    nome_fantasia: 'Exemplo Tech',
    email: 'contato@exemplo.com.br',
    telefone: '11999999999',
    uf: 'SP',
    municipio: 'São Paulo',
    porte: 'ME',
    origem_pncp: 'PNCP-001',
    last_contacted_at: null,
    contact_count: 0,
    last_contact_channel: null,
    last_contact_notes: null,
    spam_cooldown_days: 7,
    created_at: '2026-11-20T10:00:00Z',
    updated_at: '2026-11-20T10:00:00Z',
    is_in_cooldown: false,
    cooldown_remaining_days: 0,
};

describe('pncpLeadService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('listLeads', () => {
        it('deve buscar leads limpando parâmetros vazios ou indefinidos', async () => {
            const mockResponse: PncpLeadListResponse = {
                items: [mockLead],
                total: 1,
                skip: 0,
                limit: 50,
                stats: {
                    total: 1,
                    ready_for_contact: 1,
                    in_cooldown: 0,
                },
            };
            vi.mocked(api.get).mockResolvedValueOnce({ data: mockResponse });

            const result = await pncpLeadService.listLeads({
                search: 'Exemplo',
                uf: '',
                contact_status: 'ready',
                skip: 0,
                limit: 50,
            });

            expect(api.get).toHaveBeenCalledWith('/admin/leads', {
                params: {
                    search: 'Exemplo',
                    contact_status: 'ready',
                    skip: 0,
                    limit: 50,
                },
            });
            expect(result).toEqual(mockResponse);
        });
    });

    describe('syncLeads', () => {
        it('deve disparar sincronização no endpoint /admin/leads/sync', async () => {
            const mockSync: PncpLeadSyncResponse = {
                fetched: 12,
                created: 8,
                updated: 4,
                skipped: 0,
                errors: [],
            };
            vi.mocked(api.post).mockResolvedValueOnce({ data: mockSync });

            const result = await pncpLeadService.syncLeads({
                uf: 'SP',
                dias_retroativos: 7,
            });

            expect(api.post).toHaveBeenCalledWith('/admin/leads/sync', {
                uf: 'SP',
                dias_retroativos: 7,
            });
            expect(result).toEqual(mockSync);
        });
    });

    describe('registerContact', () => {
        it('deve registrar contato comercial e retornar resposta com status anti-SPAM', async () => {
            const mockContactResponse: PncpLeadContactResponse = {
                lead: {
                    ...mockLead,
                    contact_count: 1,
                    last_contact_channel: 'whatsapp',
                    is_in_cooldown: true,
                    cooldown_remaining_days: 7,
                },
                was_in_cooldown: false,
                warning_message: null,
            };
            vi.mocked(api.post).mockResolvedValueOnce({ data: mockContactResponse });

            const result = await pncpLeadService.registerContact('lead-1', {
                channel: 'whatsapp',
                notes: 'Primeiro contato comercial',
                cooldown_days: 7,
            });

            expect(api.post).toHaveBeenCalledWith('/admin/leads/lead-1/contact', {
                channel: 'whatsapp',
                notes: 'Primeiro contato comercial',
                cooldown_days: 7,
            });
            expect(result).toEqual(mockContactResponse);
        });
    });

    describe('getLeadById', () => {
        it('deve buscar detalhes de um lead por ID', async () => {
            vi.mocked(api.get).mockResolvedValueOnce({ data: mockLead });

            const result = await pncpLeadService.getLeadById('lead-1');

            expect(api.get).toHaveBeenCalledWith('/admin/leads/lead-1');
            expect(result).toEqual(mockLead);
        });
    });
});
