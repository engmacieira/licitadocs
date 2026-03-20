import api from './api';

/**
 * Interface que representa as estatísticas vitais exibidas no Dashboard do Administrador.
 * @interface AdminStats
 */
export interface AdminStats {
    /** Total de empresas cadastradas na base de dados. */
    total_companies: number;
    /** Empresas que já possuem uma subscrição/pagamento ativo. */
    active_companies: number;
    /** Empresas que concluíram o onboarding, mas aguardam validação do Admin. */
    pending_approval: number;
    /** Quantidade de documentos gerados no mês (Métrica em desenvolvimento). */
    documents_generated_month: number;
}

/**
 * Interface que representa uma empresa na fila de aprovação (Onboarding Incompleto).
 * @interface PendingAction
 */
export interface PendingAction {
    company_id: string;
    company_name: string;
    /** O passo atual em que a empresa está travada. */
    step: 'contract' | 'docs' | 'payment' | 'validation';
    date: string;
    cnpj: string;
}

/**
 * Serviço responsável pelas chamadas à API exclusivas do Painel Administrativo.
 * Gere a obtenção de KPIs e a fila de validação de clientes.
 */
export const adminService = {

    /**
     * Busca os dados reais de todas as empresas e calcula as estatísticas do Dashboard.
     * * @returns {Promise<AdminStats>} Objeto contendo os totais de clientes ativos e pendentes.
     */
    getStats: async (): Promise<AdminStats> => {
        try {
            const { data: companies } = await api.get<any[]>('/companies');

            const total = companies.length;
            const active = companies.filter(c => c.is_payment_active).length;
            const pending = companies.filter(c => !c.is_admin_verified).length;

            return {
                total_companies: total,
                active_companies: active,
                pending_approval: pending,
                documents_generated_month: 145 // TODO: Substituir por rota real de métricas de documentos futuramente
            };
        } catch (error) {
            console.error("Erro ao calcular estatísticas administrativas:", error);
            return {
                total_companies: 0,
                active_companies: 0,
                pending_approval: 0,
                documents_generated_month: 0
            };
        }
    },

    /**
     * Retorna a fila de empresas (Pending Queue) que precisam de atenção.
     * Filtra os clientes que ainda não foram verificados e identifica automaticamente
     * qual a etapa do onboarding que lhes falta (Contrato, Pagamento ou Validação Final).
     * * @returns {Promise<PendingAction[]>} Lista formatada para os cards da Fila de Aprovação.
     */
    getPendingQueue: async (): Promise<PendingAction[]> => {
        try {
            const { data: companies } = await api.get<any[]>('/companies');

            return companies
                .filter((c: any) => !c.is_admin_verified)
                .map((c: any) => {
                    // Determina qual o "passo" atual para exibir no card
                    let currentStep: PendingAction['step'] = 'validation';

                    if (!c.is_contract_signed) currentStep = 'contract';
                    else if (!c.is_payment_active) currentStep = 'payment';

                    return {
                        company_id: c.id,
                        company_name: c.razao_social || c.name || "Empresa sem nome",
                        step: currentStep,
                        date: c.created_at,
                        cnpj: c.cnpj
                    };
                });
        } catch (error) {
            console.error("Erro ao buscar fila de pendências:", error);
            return [];
        }
    }
};