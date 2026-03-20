import api from './api';

/** Escopos geográficos possíveis para um tipo de documento. */
export type DocumentScope = "NATIONAL" | "STATE" | "MUNICIPAL";

// ============================================================================
// 1. TIPAGENS (Interfaces)
// ============================================================================

/**
 * Configurações técnicas para a automação de emissão de um documento.
 * @interface DocumentAutomationConfigDTO
 */
export interface DocumentAutomationConfigDTO {
    /** Indica se o documento pode ser emitido automaticamente por um robô. */
    is_automatable: boolean;
    /** Nome da estratégia/script de automação (ex: 'ibge_crawler'). */
    strategy_name?: string | null;
    /** URL do portal de origem para a emissão. */
    source_url?: string | null;
    /** Indica se o portal exige resolução de CAPTCHA. */
    requires_captcha: boolean;
    /** Expressão Cron para o agendamento da verificação automática. */
    cron_schedule?: string | null;
    /** Parâmetros JSON adicionais específicos da estratégia. */
    extra_params?: Record<string, any> | null;
}

/**
 * Definição de um Tipo de Documento no catálogo.
 * @interface DocumentTypeDTO
 */
export interface DocumentTypeDTO {
    /** Identificador único (UUID). */
    id: string;
    /** Nome legível (ex: 'Certidão Negativa de Débitos Federais'). */
    name: string;
    /** Identificador simplificado para URLs e filtros. */
    slug: string;
    /** Prazo padrão de validade em dias após a emissão. */
    validity_days_default: number;
    description?: string;
    /** Nível geográfico da certidão. */
    scope: DocumentScope;
    /** Metadados para o motor de automação. */
    automation_config?: DocumentAutomationConfigDTO;
}

/**
 * Agrupamento lógico de tipos de documentos (ex: 'Fiscal', 'Trabalhista').
 * @interface DocumentCategoryDTO
 */
export interface DocumentCategoryDTO {
    id: string;
    name: string;
    slug: string;
    /** Ordem de exibição na interface do utilizador. */
    order: number;
    /** Lista de tipos pertencentes a esta categoria. */
    types: DocumentTypeDTO[];
}

/**
 * Objeto unificado que representa um ficheiro no cofre digital.
 * Suporta tanto o modelo legado (uploads manuais) quanto o modelo estruturado (certidões).
 * @interface DocumentDTO
 */
export interface DocumentDTO {
    id: string;
    /** Nome original do ficheiro armazenado. */
    filename: string;
    /** Título descritivo definido pelo utilizador ou sistema. */
    title?: string;
    /** Status atual (valid, expired, irregular, error, archived). */
    status: string;
    /** Data limite de validade do documento. */
    expiration_date?: string;
    /** Data de processamento/upload. */
    created_at: string;

    company_id?: string;
    company_name?: string;
    company_cnpj?: string;

    // --- Metadados do Cofre Inteligente ---
    /** Indica se o documento está vinculado a um tipo e categoria formais. */
    is_structured: boolean;
    type_id?: string;
    category_id?: string;
    type_name?: string;
    category_name?: string;
    /** Chave de validação para conferência em portais governamentais. */
    authentication_code?: string;
    /** Indica se o ficheiro foi enviado pelo cliente (pendente de validação). */
    is_client_upload?: boolean;
}

export interface DocumentCategoryCreateDTO { name: string; slug: string; order: number; }
export interface DocumentCategoryUpdateDTO { name?: string; slug?: string; order?: number; }

export interface DocumentTypeCreateDTO {
    name: string;
    slug: string;
    validity_days_default: number;
    description?: string;
    category_id: string;
    scope: DocumentScope;
    automation_config?: DocumentAutomationConfigDTO;
}

export interface DocumentTypeUpdateDTO {
    name?: string; slug?: string; validity_days_default?: number;
    description?: string; category_id?: string; scope?: DocumentScope;
    automation_config?: DocumentAutomationConfigDTO;
}

// ============================================================================
// 2. SERVIÇO (API Calls)
// ============================================================================

/**
 * Serviço responsável por toda a gestão documental da plataforma.
 * Inclui o catálogo de tipos, operações de upload inteligente, downloads
 * e monitorização de conformidade (irregularidades e vencimentos).
 */
export const documentService = {
    /**
     * Recupera o catálogo completo de categorias e seus respetivos tipos.
     * @returns {Promise<DocumentCategoryDTO[]>}
     */
    getTypes: async (): Promise<DocumentCategoryDTO[]> => {
        const { data } = await api.get<DocumentCategoryDTO[]>('/documents/types');
        return data;
    },

    /**
     * Lista os documentos do cofre, com suporte a filtragem por empresa para administradores.
     * @param {string} [companyId] - ID da empresa para filtrar (Opcional).
     * @returns {Promise<DocumentDTO[]>}
     */
    getAll: async (companyId?: string): Promise<DocumentDTO[]> => {
        const url = companyId ? `/documents/?company_id=${companyId}` : '/documents/';
        const { data } = await api.get<DocumentDTO[]>(url);
        return data;
    },

    /**
     * Realiza o upload inteligente de um documento para a base de dados.
     * Converte o payload para multipart/form-data e suporta metadados de estruturação.
     * @param {File | null} file - O ficheiro binário (PDF/Imagem).
     * @param {string} targetCompanyId - ID da empresa proprietária.
     * @param {Object} [options] - Metadados adicionais (Título, Tipo, Autenticação, Status).
     * @returns {Promise<DocumentDTO>}
     */
    upload: async (
        file: File | null,
        targetCompanyId: string,
        options?: {
            title?: string;
            typeId?: string;
            authenticationCode?: string;
            expirationDate?: string;
            status?: string;
            notes?: string;
        }
    ): Promise<DocumentDTO> => {
        const formData = new FormData();

        if (file) formData.append('file', file);
        formData.append('target_company_id', targetCompanyId);

        if (options?.title) formData.append('title', options.title);
        if (options?.typeId) formData.append('type_id', options.typeId);
        if (options?.authenticationCode) formData.append('authentication_code', options.authenticationCode);
        if (options?.expirationDate) formData.append('expiration_date', options.expirationDate);
        if (options?.status) formData.append('status', options.status);
        if (options?.notes) formData.append('notes', options.notes);

        const { data } = await api.post<DocumentDTO>('/documents/upload', formData);
        return data;
    },

    /**
     * Executa o download de um documento forçando o comportamento nativo de transferência do navegador.
     * @param {string} docId - ID do documento.
     * @param {string} filename - Nome sugerido para o ficheiro após o download.
     */
    downloadDocument: async (docId: string, filename: string): Promise<void> => {
        const { data } = await api.get(`/documents/${docId}/download`, {
            responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    // --- Gestão de Categorias (CRUD) ---
    createCategory: async (payload: DocumentCategoryCreateDTO): Promise<DocumentCategoryDTO> => {
        const { data } = await api.post<DocumentCategoryDTO>('/documents/categories', payload);
        return data;
    },
    updateCategory: async (id: string, payload: DocumentCategoryUpdateDTO): Promise<DocumentCategoryDTO> => {
        const { data } = await api.put<DocumentCategoryDTO>(`/documents/categories/${id}`, payload);
        return data;
    },
    deleteCategory: async (id: string): Promise<void> => {
        await api.delete(`/documents/categories/${id}`);
    },

    // --- Gestão de Tipos (CRUD) ---
    createType: async (payload: DocumentTypeCreateDTO): Promise<DocumentTypeDTO> => {
        const { data } = await api.post<DocumentTypeDTO>('/documents/types', payload);
        return data;
    },
    updateType: async (id: string, payload: DocumentTypeUpdateDTO): Promise<DocumentTypeDTO> => {
        const { data } = await api.put<DocumentTypeDTO>(`/documents/types/${id}`, payload);
        return data;
    },
    deleteType: async (id: string): Promise<void> => {
        await api.delete(`/documents/types/${id}`);
    },

    /**
     * Monitorização (Admin): Busca documentos próximos do vencimento ou já expirados em todo o sistema.
     * @param {number} [days=30] - Janela de dias para considerar a expiração.
     * @returns {Promise<DocumentDTO[]>}
     */
    getExpiring: async (days: number = 30): Promise<DocumentDTO[]> => {
        const { data } = await api.get<DocumentDTO[]>(`/documents/expiring?days=${days}`);
        return data;
    },

    /** Monitorização (Admin): Busca documentos marcados com falhas ou irregularidades. */
    getIrregular: async (): Promise<DocumentDTO[]> => {
        const { data } = await api.get<DocumentDTO[]>('/documents/irregular');
        return data;
    },

    /** Remove um documento permanentemente do sistema. */
    deleteDocument: async (id: string): Promise<void> => {
        await api.delete(`/documents/${id}`);
    },

    /** Atualiza metadados específicos de um documento existente. */
    updateDocument: async (id: string, payload: any): Promise<void> => {
        await api.patch(`/documents/${id}`, payload);
    },
};