import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentService } from '../../../services/documentService';
import { companyService } from '../../../services/companyService';
import type { Company } from '../../../services/companyService';
import { UploadCloud, Calendar, Building2, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function AdminUpload() {
    const navigate = useNavigate();

    // Estados do Formulário
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');
    const [expirationDate, setExpirationDate] = useState('');
    const [file, setFile] = useState<File | null>(null);

    // Estados de UI
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Carrega a lista de empresas para o Dropdown
    useEffect(() => {
        loadCompanies();
    }, []);

    async function loadCompanies() {
        try {
            setLoading(true);
            const data = await companyService.getAll();
            setCompanies(data);
        } catch (error) {
            toast.error("Erro ao carregar lista de empresas."); // <--- Toast
        } finally {
            setLoading(false);
        }
    }

    async function handleUpload(e: React.FormEvent) {
        e.preventDefault();

        if (!file || !selectedCompanyId || !expirationDate) {
            toast.warning("Por favor, preencha todos os campos."); // <--- Toast
            return;
        }

        try {
            setUploading(true);

            // UX: Toast de "Processando"
            const promise = documentService.upload(file, expirationDate, selectedCompanyId);

            toast.promise(promise, {
                loading: 'Enviando documento para o cofre...',
                success: 'Documento enviado e processado com sucesso!',
                error: 'Erro ao fazer upload. Verifique o arquivo.'
            });

            await promise;

            // Limpa o form após sucesso
            setFile(null);
            setExpirationDate('');
            // Opcional: navigate('/admin/dashboard'); 
        } catch (error) {
            console.error(error);
            // O erro já é tratado pelo toast.promise, mas se quiser manual:
            // toast.error("Falha no envio");
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative overflow-hidden">
                {/* Loader de Progresso no Topo (US-UI-02) */}
                {uploading && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-100">
                        <div className="h-full bg-blue-600 animate-progress origin-left"></div>
                    </div>
                )}

                {/* ... (Cabeçalho igual) ... */}

                <form onSubmit={handleUpload} className="space-y-6">
                    {/* ... (Inputs iguais) ... */}

                    {/* Botão com Estado de Loading Visual */}
                    <button
                        type="submit"
                        disabled={uploading}
                        className={`w-full py-3 px-4 rounded-lg text-white font-bold shadow-md transition-all flex items-center justify-center gap-2 ${uploading
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                            }`}
                    >
                        {uploading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <UploadCloud size={20} />
                                Confirmar Upload
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}