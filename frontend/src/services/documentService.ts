import api from './api';

export interface DocumentDTO {
    id: string;
    filename: string;
    title?: string;
    created_at?: string; // Opcional pois pode vir nulo do back em alguns casos
    owner_id: string;
    status: string;
    expiration_date?: string;
    company_id?: string;
}

export const documentService = {
    /**
     * Busca todos os documentos.
     * @param companyId - Opcional. Se fornecido, filtra documentos daquela empresa (para Admins).
     */
    getAll: async (companyId?: string): Promise<DocumentDTO[]> => {
        // Constrói a Query String apenas se necessário, mantendo a URL limpa
        const url = companyId
            ? `/documents/?company_id=${companyId}`
            : '/documents/';

        const { data } = await api.get<DocumentDTO[]>(url);
        return data;
    },

    /**
     * Realiza o upload de um arquivo.
     * @param file - O arquivo binário.
     * @param title - O título exibível (pode ser diferente do filename).
     * @param targetCompanyId - (Admin) ID da empresa dona do arquivo.
     */
    upload: async (file: File, title?: string, targetCompanyId?: string, expirationDate?: string): Promise<DocumentDTO> => {
        const formData = new FormData();
        formData.append('file', file);

        // Clean Code: Só adiciona ao FormData se o valor existir (evita enviar "undefined" string)
        if (title) {
            formData.append('title', title);
        }

        if (targetCompanyId) {
            formData.append('target_company_id', targetCompanyId);
        }

        if (expirationDate) {
            formData.append('expiration_date', expirationDate);
        }

        const { data } = await api.post<DocumentDTO>('/documents/upload', formData);
        return data;
    },

    /**
     * Baixa o documento forçando o comportamento nativo do navegador.
     * Nota: Mantém a responsabilidade de criar o Blob aqui para abstrair a complexidade do Componente.
     */
    downloadDocument: async (docId: string, filename: string): Promise<void> => {
        const { data } = await api.get(`/documents/${docId}/download`, {
            responseType: 'blob'
        });

        // Criação de URL temporária para download (Memory Safe)
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');

        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);

        link.click();

        // Limpeza imediata para evitar Memory Leak
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};