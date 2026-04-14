import api from './api';
import type { EmissionRuleDTO, EmissionRuleCreatePayload, EmissionRuleUpdatePayload } from '../types';

/**
 * Serviço responsável por gerir o diretório de regras de emissão de certidões.
 * Permite ao Administrador configurar como cada documento deve ser obtido
 * dependendo da localização geográfica da empresa.
 */
export const emissionRuleService = {
    /**
     * Recupera a listagem completa de todas as regras de emissão cadastradas.
     * @returns {Promise<EmissionRuleDTO[]>}
     */
    getAll: async (): Promise<EmissionRuleDTO[]> => {
        const { data } = await api.get<EmissionRuleDTO[]>('/emission-rules/');
        return data;
    },

    /**
     * Recupera os detalhes de uma regra específica através do seu ID.
     * @param {string} id - ID da regra.
     * @returns {Promise<EmissionRuleDTO>}
     */
    getById: async (id: string): Promise<EmissionRuleDTO> => {
        const { data } = await api.get<EmissionRuleDTO>(`/emission-rules/${id}`);
        return data;
    },

    /**
     * Cria uma nova regra de emissão no sistema.
     * @param {EmissionRuleCreatePayload} payload - Dados da nova regra.
     * @returns {Promise<EmissionRuleDTO>} A regra criada com ID e data.
     */
    create: async (payload: EmissionRuleCreatePayload): Promise<EmissionRuleDTO> => {
        const { data } = await api.post<EmissionRuleDTO>('/emission-rules/', payload);
        return data;
    },

    /**
     * Atualiza os dados de uma regra de emissão existente.
     * @param {string} id - ID da regra a ser editada.
     * @param {EmissionRuleUpdatePayload} payload - Campos a atualizar.
     * @returns {Promise<EmissionRuleDTO>}
     */
    update: async (id: string, payload: EmissionRuleUpdatePayload): Promise<EmissionRuleDTO> => {
        const { data } = await api.put<EmissionRuleDTO>(`/emission-rules/${id}`, payload);
        return data;
    },

    /**
     * Remove permanentemente uma regra de emissão do sistema.
     * @param {string} id - ID da regra a eliminar.
     */
    delete: async (id: string): Promise<void> => {
        await api.delete(`/emission-rules/${id}`);
    },

    /**
     * Resolve de forma inteligente qual a regra aplicável para uma empresa e documento.
     * O backend procura primeiro uma regra Municipal, depois Estadual e, por fim, Nacional.
     * @param {string} documentTypeId - ID do tipo de documento (Ex: CND Municipal).
     * @param {string} companyId - ID da empresa para extrair a localização (Cidade/UF).
     * @returns {Promise<EmissionRuleDTO | null>} A regra mais específica encontrada ou null.
     */
    resolveLink: async (documentTypeId: string, companyId: string): Promise<EmissionRuleDTO | null> => {
        try {
            const { data } = await api.get<EmissionRuleDTO>(`/emission-rules/resolve`, {
                params: { document_type_id: documentTypeId, company_id: companyId }
            });
            return data;
        } catch {
            return null; // Retorna null em caso de 404 (Regra não encontrada)
        }
    }
};