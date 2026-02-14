import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, UploadCloud, FileText, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { documentService } from '../../services/documentService';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    targetCompanyId: string;
}

interface UploadForm {
    title: string;
    file: FileList;
    expiration_date: string;
}

export function UploadModal({ isOpen, onClose, onSuccess, targetCompanyId }: UploadModalProps) {
    const [isUploading, setIsUploading] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm<UploadForm>();

    if (!isOpen) return null;

    async function handleUpload(data: UploadForm) {
        if (!data.file?.[0]) {
            toast.error("Selecione um arquivo PDF ou Imagem.");
            return;
        }

        setIsUploading(true);
        try {
            // Chama o serviço passando o ID da empresa alvo
            await documentService.upload(
                data.file[0],
                data.title,
                targetCompanyId,
                data.expiration_date // Passamos a validade se houver
            );

            toast.success("Certidão enviada com sucesso!");
            reset();
            onSuccess(); // Recarrega a lista lá no pai
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao enviar documento.");
        } finally {
            setIsUploading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <UploadCloud className="h-5 w-5 text-blue-600" />
                        Nova Certidão / Documento
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(handleUpload)} className="p-6 space-y-4">

                    {/* Input Arquivo */}
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer relative">
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            {...register('file', { required: "Arquivo é obrigatório" })}
                        />
                        <div className="space-y-2 pointer-events-none">
                            <div className="bg-blue-100 text-blue-600 p-3 rounded-full w-fit mx-auto">
                                <FileText size={24} />
                            </div>
                            <p className="text-sm font-medium text-slate-700">
                                Clique para selecionar o arquivo
                            </p>
                            <p className="text-xs text-slate-400">PDF ou Imagem (Max 10MB)</p>
                        </div>
                    </div>
                    {errors.file && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {errors.file.message}</p>}

                    {/* Campos de Texto */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1 block">Tipo de Documento</label>
                            <select
                                {...register('title', { required: true })}
                                className="w-full rounded-lg border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Selecione o tipo...</option>
                                <option value="Certidão Negativa Federal">Certidão Negativa Federal</option>
                                <option value="Certidão Negativa Estadual">Certidão Negativa Estadual</option>
                                <option value="Certidão Negativa Municipal">Certidão Negativa Municipal</option>
                                <option value="Certidão FGTS">Certidão FGTS</option>
                                <option value="Certidão Trabalhista">Certidão Trabalhista</option>
                                <option value="Cartão CNPJ">Cartão CNPJ (Atualizado)</option>
                                <option value="Contrato Social">Contrato Social (Atualizado)</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>

                        <Input
                            type="date"
                            label="Data de Validade (Vencimento)"
                            icon={<Calendar className="h-4 w-4 text-slate-400" />}
                            {...register('expiration_date')}
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={isUploading} className="flex-1">
                            Enviar Documento
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}