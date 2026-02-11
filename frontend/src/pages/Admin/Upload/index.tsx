import { useEffect, useState, useRef } from 'react';
import { companyService } from '../../../services/companyService';
import type { Company } from '../../../services/companyService';
import { Button } from '../../../components/ui/Button';
import { UploadCloud, Building2, CheckCircle, Search, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function UploadPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // Referência para o input de arquivo
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadCompanies();
    }, []);

    async function loadCompanies() {
        try {
            const data = await companyService.getAll();
            // Ordena alfabeticamente para facilitar a busca visual
            const sorted = data.sort((a, b) =>
                (a.razao_social || a.name).localeCompare(b.razao_social || b.name)
            );
            setCompanies(sorted);
        } catch (error) {
            toast.error("Erro ao carregar lista de empresas.");
        } finally {
            setLoading(false);
        }
    }

    async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        if (!selectedCompanyId) {
            toast.warning("Por favor, selecione uma empresa antes de enviar o arquivo.");
            // Limpa o input para permitir tentar de novo
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const file = files[0];
        setIsUploading(true);
        const toastId = toast.loading(`Enviando ${file.name}...`);

        try {
            await companyService.uploadDocument(selectedCompanyId, file);

            toast.dismiss(toastId);
            toast.success("Upload realizado com sucesso!");

            // Opcional: Limpar a seleção após o sucesso
            // setSelectedCompanyId(''); 

        } catch (error) {
            toast.dismiss(toastId);
            toast.error("Falha ao enviar documento.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    // Encontra a empresa selecionada para mostrar detalhes (feedback visual)
    const selectedCompany = companies.find(c => c.id === selectedCompanyId);

    return (
        <div className="p-8 space-y-8 max-w-4xl mx-auto">
            {/* Cabeçalho */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <UploadCloud className="h-8 w-8 text-blue-600" />
                    Upload Centralizado
                </h1>
                <p className="text-slate-500 mt-1">
                    Envie documentos para qualquer empresa de forma rápida.
                </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-8">

                {/* 1. Seleção de Empresa */}
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700">
                        1. Selecione a Empresa Destino
                    </label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                        <select
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                            disabled={loading || isUploading}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-slate-700 transition-all"
                        >
                            <option value="">-- Selecione uma empresa da lista --</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.razao_social || company.name} ({company.cnpj})
                                </option>
                            ))}
                        </select>
                        {/* Ícone de seta customizado (opcional, ou usa o nativo do browser) */}
                    </div>

                    {/* Feedback da Seleção */}
                    {selectedCompany && (
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-100 animate-in fade-in slide-in-from-top-1">
                            <CheckCircle className="h-4 w-4" />
                            <span>
                                Enviando para: <strong>{selectedCompany.razao_social}</strong>
                            </span>
                        </div>
                    )}
                </div>

                {/* 2. Área de Upload */}
                <div className={`space-y-3 transition-opacity duration-300 ${!selectedCompanyId ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                    <label className="block text-sm font-medium text-slate-700">
                        2. Envie o Arquivo
                    </label>

                    <div
                        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 group ${isUploading
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-slate-50 border-slate-300 hover:bg-white hover:border-blue-400 hover:shadow-md'
                            }`}
                        onClick={() => selectedCompanyId && fileInputRef.current?.click()}
                    >
                        <div className="flex flex-col items-center pointer-events-none">
                            <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 transition-colors ${isUploading ? 'bg-blue-200 text-blue-700 animate-pulse' : 'bg-white text-blue-600 shadow-sm group-hover:scale-110 group-hover:text-blue-500'
                                }`}>
                                {isUploading ? <UploadCloud className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
                            </div>

                            <h3 className="text-lg font-medium text-slate-900">
                                {isUploading ? 'Enviando...' : 'Clique para selecionar o arquivo'}
                            </h3>
                            <p className="text-slate-500 mt-2 max-w-sm mx-auto text-sm">
                                Suporta PDF, Word, Excel e Imagens. O arquivo será vinculado automaticamente à empresa selecionada acima.
                            </p>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={!selectedCompanyId || isUploading}
                        />
                    </div>
                </div>

                {/* Dica de Rodapé */}
                <div className="pt-4 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">
                        Dica: Para ver os arquivos enviados, acesse o menu <strong className="text-slate-600">Gestão de Empresas</strong> e clique no ícone de "Olho".
                    </p>
                </div>
            </div>
        </div>
    );
}