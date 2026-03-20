import api from './api';
import type { Company } from './companyService';
import type { DocumentDTO } from './documentService';

/**
 * Interface que representa as estatísticas consolidadas para o Painel Administrativo.
 * @interface AdminStats
 */
export interface AdminStats {
    /** Número total de empresas cadastradas no ecossistema. */
    total_companies: number;
    /** Volume total de documentos (certidões, contratos, etc.) sob gestão. */
    total_documents: number;
    /** Total de usuários ativos na plataforma. */
    total_users: number;
    /** Lista dos documentos mais recentemente processados ou emitidos. */
    recent_documents: DocumentDTO[];
    /** Lista das últimas empresas que realizaram cadastro. */
    recent_companies: Company[];
}

/**
 * Interface que representa os indicadores de saúde e status para o Painel do Cliente.
 * @interface ClientStats
 */
export interface ClientStats {
    /** Razão Social da empresa logada. */
    company_name: string;
    /** Total de documentos vinculados à empresa. */
    total_docs: number;
    /** Quantidade de certidões dentro do prazo de validade. */
    docs_valid: number;
    /** Quantidade de documentos que expiraram e precisam de renovação. */
    docs_expired: number;
    /** Lista curta dos documentos atualizados mais recentemente no cofre. */
    recent_docs: DocumentDTO[];

    // --- Flags de Status de Onboarding ---
    /** Indica se a empresa já assinou o contrato de adesão. */
    is_contract_signed: boolean;
    /** Indica se o plano de pagamento está regularizado. */
    is_payment_active: boolean;
    /** Indica se o cadastro foi validado pela equipe administrativa. */
    is_admin_verified: boolean;
}

/**
 * Serviço responsável por buscar dados agregados e métricas para os Dashboards.
 * Isola as consultas complexas de contagem e status em métodos simples de consumo.
 */
export const dashboardService = {
    /**
     * Recupera as estatísticas globais do sistema para a visão do Administrador.
     * @returns {Promise<AdminStats>} Promessa contendo totais e listas recentes.
     */
    getAdminStats: async (): Promise<AdminStats> => {
        const { data } = await api.get<AdminStats>('/dashboard/admin/stats');
        return data;
    },

    /**
     * Recupera as estatísticas e status de regularidade de uma empresa específica.
     * Caso o Admin esteja visualizando, ele pode passar o ID da empresa alvo.
     * @param {string} [companyId] - (Opcional) ID da empresa para consulta específica via Admin.
     * @returns {Promise<ClientStats>} Promessa contendo os KPIs de saúde fiscal do cliente.
     */
    getClientStats: async (companyId?: string): Promise<ClientStats> => {
        const url = companyId
            ? `/dashboard/client/stats?company_id=${companyId}`
            : '/dashboard/client/stats';

        const { data } = await api.get<ClientStats>(url);
        return data;
    }
};