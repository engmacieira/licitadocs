import api from './api';

// ============================================================================
// 1. TIPAGENS (Interfaces)
// ============================================================================

// --- Novo Catálogo (Sprint 17) ---
export interface DocumentTypeDTO {
    id: string;
    name: string;
    slug: string;
    validity_days_default: number;
    description?: string;
}

export interface DocumentCategoryDTO {
    id: string;
    name: string;
    slug: string;
    order: number;
    types: DocumentTypeDTO[];
}

// --- DTO Unificado (Legado + Novo Cofre) ---
export interface DocumentDTO {
    id: string;
    filename: string;
    title?: string;
    status: string;
    expiration_date?: string;
    created_at: string;

    // Flags do Cofre Inteligente (Adicionados na Sprint 17)
    is_structured: boolean;
    type_id?: string;
    category_id?: string;
    type_name?: string;
    category_name?: string;
    authentication_code?: string;
}

export interface DocumentCategoryCreateDTO {
    name: string;
    slug: string;
    order: number;
}

export interface DocumentCategoryUpdateDTO {
    name?: string;
    slug?: string;
    order?: number;
}

export interface DocumentTypeCreateDTO {
    name: string;
    slug: string;
    validity_days_default: number;
    description?: string;
    category_id: string;
}

export interface DocumentTypeUpdateDTO {
    name?: string;
    slug?: string;
    validity_days_default?: number;
    description?: string;
    category_id?: string;
}

// ============================================================================
// 2. SERVIÇO (API Calls)
// ============================================================================

export const documentService = {
    /**
     * NOVO: Busca o catálogo completo de Categorias e Tipos
     * Usado para popular os dropdowns de Upload e organizar a UI.
     */
    getTypes: async (): Promise<DocumentCategoryDTO[]> => {
        const { data } = await api.get<DocumentCategoryDTO[]>('/documents/types');
        return data;
    },

    /**
     * Busca todos os documentos (Agora retorna o DTO Unificado com legado e certidões).
     * @param companyId - Opcional. Se fornecido, filtra documentos daquela empresa (para Admins).
     */
    getAll: async (companyId?: string): Promise<DocumentDTO[]> => {
        const url = companyId
            ? `/documents/?company_id=${companyId}`
            : '/documents/';

        const { data } = await api.get<DocumentDTO[]>(url);
        return data;
    },

    /**
     * Realiza o upload Inteligente (Roteia para Tabela Antiga ou Nova).
     * @param file - O arquivo físico PDF.
     * @param targetCompanyId - (Admin) ID da empresa dona do arquivo.
     * @param options - Metadados adicionais do documento (Título, Tipo, Data, etc).
     */
    upload: async (
        file: File,
        targetCompanyId: string,
        options?: {
            title?: string;
            typeId?: string; // NOVO: Define se vai pra tabela Certificates
            authenticationCode?: string; // NOVO: Código de autenticação
            expirationDate?: string;
        }
    ): Promise<DocumentDTO> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('target_company_id', targetCompanyId);

        // Preenche os dados opcionais se existirem
        if (options?.title) formData.append('title', options.title);
        if (options?.typeId) formData.append('type_id', options.typeId);
        if (options?.authenticationCode) formData.append('authentication_code', options.authenticationCode);
        if (options?.expirationDate) formData.append('expiration_date', options.expirationDate);

        const { data } = await api.post<DocumentDTO>('/documents/upload', formData);
        return data;
    },

    /**
     * Baixa o documento forçando o comportamento nativo do navegador.
     * Compatível com documentos legados e certificados estruturados.
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

    // Tipos de Documentos
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
    }
};