import { ArrowRight, CheckCircle2, Upload, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

/**
 * Propriedades do componente SignatureUpload.
 * @interface SignatureUploadProps
 */
interface SignatureUploadProps {
    contractFile: File | null;
    setContractFile: (file: File | null) => void;
    proxyFile: File | null;
    setProxyFile: (file: File | null) => void;
    handleComplete: () => void;
    isLoading: boolean;
}

/**
 * Componente visual que disponibiliza as zonas de arrastar e largar (Drag & Drop)
 * para os ficheiros já assinados, validando a obrigatoriedade antes de submeter.
 */
export function SignatureUpload({ contractFile, setContractFile, proxyFile, setProxyFile, handleComplete, isLoading }: SignatureUploadProps) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
            <h3 className="font-bold text-slate-900 border-b pb-2">Anexar Documentos Assinados</h3>

            <FileUploadZone
                id="contract-upload"
                label="Contrato SaaS Assinado"
                file={contractFile}
                setFile={setContractFile}
            />

            <FileUploadZone
                id="proxy-upload"
                label="Procuração Assinada"
                file={proxyFile}
                setFile={setProxyFile}
            />

            <Button
                className="w-full mt-4"
                size="lg"
                onClick={handleComplete}
                disabled={!contractFile || !proxyFile}
                isLoading={isLoading}
            >
                Finalizar e Enviar <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
    );
}

/**
 * Subcomponente interno para renderizar a caixa de upload individual.
 */
function FileUploadZone({ id, label, file, setFile }: any) {
    return (
        <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">{label}</label>
            <div className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${file ? 'border-green-200 bg-green-50' : 'border-slate-300 hover:border-blue-400 bg-slate-50'}`}>
                <input
                    type="file"
                    id={id}
                    className="hidden"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                />

                {file ? (
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 truncate">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                            <span className="text-sm font-medium text-green-800 truncate">{file.name}</span>
                        </div>
                        <button type="button" onClick={() => setFile(null)} className="p-1 hover:bg-green-100 rounded text-green-600">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <label htmlFor={id} className="flex flex-col items-center justify-center cursor-pointer py-3">
                        <Upload className="h-6 w-6 text-slate-400 mb-2" />
                        <span className="text-sm font-medium text-slate-600 text-center">Clique para procurar o PDF assinado</span>
                    </label>
                )}
            </div>
        </div>
    );
}