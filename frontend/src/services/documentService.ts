import api from './api';
import type {
    DocumentCategoryDTO,
    DocumentDTO,
    DocumentCategoryCreateDTO,
    DocumentCategoryUpdateDTO,
    DocumentTypeCreateDTO,
    DocumentTypeUpdateDTO,
    DocumentTypeDTO
} from '../types';

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

    /**
     * Solicita ao backend a geração de um arquivo ZIP contendo todos os documentos válidos.
     * @param {string} [companyId] - ID da empresa (necessário para admins).
     * @param {string} [filename] - Nome do arquivo a ser salvo.
     */
    downloadAllValidZip: async (companyId?: string, filename: string = 'documentos.zip'): Promise<void> => {
        const url = companyId ? `/documents/export/zip?company_id=${companyId}` : '/documents/export/zip';

        // Solicita a resposta em formato binário (Blob)
        const { data } = await api.get(url, { responseType: 'blob' });

        // Cria o link temporário para forçar o download no navegador
        const blobUrl = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
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
    updateDocument: async (id: string, payload: Partial<DocumentDTO>): Promise<void> => {
        await api.patch(`/documents/${id}`, payload);
    },
};