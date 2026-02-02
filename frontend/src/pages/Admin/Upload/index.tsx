import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentService } from '../../../services/documentService';
import { companyService } from '../../../services/companyService';
import type { Company } from '../../../services/companyService';
import { UploadCloud, Calendar, Building2, FileText } from 'lucide-react';

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
            alert("Erro ao carregar lista de empresas.");
        } finally {
            setLoading(false);
        }
    }

    async function handleUpload(e: React.FormEvent) {
        e.preventDefault();

        if (!file || !selectedCompanyId || !expirationDate) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        try {
            setUploading(true);
            // Chama o serviço atualizado enviando os 3 dados
            await documentService.upload(file, expirationDate, selectedCompanyId);

            alert("Documento enviado com sucesso!");
            navigate('/admin/dashboard'); // Volta para o painel
        } catch (error) {
            console.error(error);
            alert("Erro ao fazer upload. Verifique se é um PDF válido.");
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl">
                <div className="mb-8 border-b pb-4">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <UploadCloud className="text-blue-600" />
                        Envio Administrativo
                    </h1>
                    <p className="text-gray-500">Envie documentos para o cofre do cliente.</p>
                </div>

                <form onSubmit={handleUpload} className="space-y-6">

                    {/* 1. Seleção de Empresa */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Building2 size={16} /> Empresa Cliente
                        </label>
                        <select
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                            disabled={loading}
                        >
                            <option value="">Selecione uma empresa...</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.razao_social} ({company.cnpj})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 2. Data de Validade */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Calendar size={16} /> Validade do Documento
                        </label>
                        <input
                            type="date"
                            value={expirationDate}
                            onChange={(e) => setExpirationDate(e.target.value)}
                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                        />
                        <p className="text-xs text-gray-400 mt-1">Essencial para o sistema de alertas.</p>
                    </div>

                    {/* 3. Arquivo */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <FileText size={16} /> Arquivo PDF
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                {file ? (
                                    <span className="text-blue-600 font-medium">{file.name}</span>
                                ) : (
                                    <span className="text-gray-500">Clique para selecionar o PDF</span>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Botão de Envio */}
                    <button
                        type="submit"
                        disabled={uploading}
                        className={`w-full py-3 px-4 rounded-lg text-white font-bold shadow-md transition-all ${uploading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                            }`}
                    >
                        {uploading ? 'Enviando e Processando...' : 'Confirmar Upload'}
                    </button>
                </form>
            </div>
        </div>
    );
}