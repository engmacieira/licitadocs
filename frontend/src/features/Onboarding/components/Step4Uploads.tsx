import { FileText, ArrowLeft, CheckCircle2, X, Upload } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

/**
 * Propriedades para o componente Step4Uploads.
 * @interface Step4UploadsProps
 */
interface Step4UploadsProps {
    setStep: (step: number) => void;
    isLoading: boolean;
    files: {
        socialContract: File | null;
        cnpjCard: File | null;
        responsibleDoc: File | null;
        proxyDoc: File | null;
    };
    setFiles: {
        setSocialContract: (f: File | null) => void;
        setCnpjCard: (f: File | null) => void;
        setResponsibleDoc: (f: File | null) => void;
        setProxyDoc: (f: File | null) => void;
    };
}

/**
 * Passo 4 (Final) do Wizard de Registo: Upload de Documentos Obrigatórios.
 * Recebe os ficheiros e possui o botão de submissão final do formulário.
 */
export function Step4Uploads({ setStep, isLoading, files, setFiles }: Step4UploadsProps) {
    return (
        <div className="space-y-5 animate-in slide-in-from-right duration-300">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 items-start">
                <FileText className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 leading-relaxed">
                    Anexe os documentos (PDF ou Imagem) para que nossa equipe valide seu acesso.
                </p>
            </div>

            <FileField label="Contrato Social Atualizado" file={files.socialContract} setFile={setFiles.setSocialContract} id="social" />
            <FileField label="Cartão CNPJ (Emitido nos últimos 30 dias)" file={files.cnpjCard} setFile={setFiles.setCnpjCard} id="cnpj" />
            <FileField label="Documento com Foto (RG/CNH do Responsável)" file={files.responsibleDoc} setFile={setFiles.setResponsibleDoc} id="doc" />
            <FileField label="Procuração (Opcional)" file={files.proxyDoc} setFile={setFiles.setProxyDoc} id="proxy" />

            <div className="flex gap-3 pt-6 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setStep(3)} className="w-1/3 h-12" disabled={isLoading}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button type="submit" className="w-2/3 h-12 shadow-lg shadow-blue-600/20" disabled={isLoading}>
                    {isLoading ? <span className="animate-spin mr-2 border-2 border-white border-t-transparent rounded-full h-4 w-4"></span> : null}
                    Finalizar Cadastro
                </Button>
            </div>
        </div>
    );
}

/**
 * Propriedades do componente auxiliar FileField.
 * @interface FileFieldProps
 */
interface FileFieldProps {
    label: string;
    file: File | null;
    setFile: (f: File | null) => void;
    id: string;
}

/**
 * Subcomponente de interface para a área de upload de documentos (Passo 4).
 * Renderiza uma área estilizada de drag & drop com feedback interativo.
 */
function FileField({ label, file, setFile, id }: FileFieldProps) {
    return (
        <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-700">{label}</span>
            <div className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${file ? 'border-green-200 bg-green-50' : 'border-slate-200 hover:border-blue-400 bg-slate-50'}`}>
                <input
                    type="file" id={id} className="hidden" accept=".pdf,image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                />

                {file ? (
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 truncate">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                            <span className="text-sm font-medium text-green-800 truncate">{file.name}</span>
                        </div>
                        <button type="button" onClick={() => setFile(null)} className="p-1 hover:bg-green-100 rounded text-green-600" aria-label="Remover ficheiro">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <label htmlFor={id} className="flex flex-col items-center justify-center cursor-pointer py-2">
                        <Upload className="h-6 w-6 text-slate-400 mb-1" />
                        <span className="text-xs font-medium text-slate-500">Clique para anexar arquivo</span>
                    </label>
                )}
            </div>
        </div>
    );
}