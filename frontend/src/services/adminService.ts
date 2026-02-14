import api from './api';
import type { Company } from './companyService';

export interface AdminStats {
    total_companies: number;
    active_companies: number;
    pending_approval: number;
    documents_generated_month: number;
}

export interface PendingAction {
    company_id: string;
    company_name: string;
    step: 'contract' | 'docs' | 'payment' | 'validation';
    date: string;
    cnpj: string;
}

export const adminService = {
    // 1. Busca dados REAIS e calcula as estatísticas
    getStats: async (): Promise<AdminStats> => {
        try {
            // Busca todas as empresas do banco
            const { data: companies } = await api.get<any[]>('/companies');

            // Cálculos Reais
            const total = companies.length;

            // Consideramos ativa se tiver pagamento ativo (independente de validação admin por enquanto)
            const active = companies.filter(c => c.is_payment_active).length;

            // Pendentes: Aquelas que não foram verificadas pelo admin
            const pending = companies.filter(c => !c.is_admin_verified).length;

            return {
                total_companies: total,
                active_companies: active,
                pending_approval: pending,
                documents_generated_month: 145 // Esse dado ainda é mock pois não temos rota de "todos docs"
            };
        } catch (error) {
            console.error("Erro ao calcular stats", error);
            return {
                total_companies: 0,
                active_companies: 0,
                pending_approval: 0,
                documents_generated_month: 0
            };
        }
    },

    // 2. Fila de Aprovação (Dados Reais)
    getPendingQueue: async (): Promise<PendingAction[]> => {
        try {
            const { data: companies } = await api.get<any[]>('/companies'); // any para acessar as flags novas

            return companies
                // FILTRO: Mostra qualquer empresa que o Admin ainda NÃO aprovou
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
            console.error("Erro ao buscar fila", error);
            return [];
        }
    }
};