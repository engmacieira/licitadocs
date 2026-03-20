import { AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';

/**
 * Componente visual estático que exibe o guia passo a passo para assinatura
 * digital no portal Gov.br, incluindo o aviso de validade jurídica (STJ).
 */
export function SignatureInstructions() {
    return (
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm">
            <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Como Assinar?
            </h3>

            <ol className="space-y-4 text-sm text-blue-800">
                <li className="flex gap-3">
                    <span className="flex items-center justify-center bg-blue-200 w-6 h-6 rounded-full font-bold shrink-0">1</span>
                    <span>Navegue pelas abas ao lado e clique em "Salvar (PDF)" para baixar os dois documentos.</span>
                </li>
                <li className="flex gap-3">
                    <span className="flex items-center justify-center bg-blue-200 w-6 h-6 rounded-full font-bold shrink-0">2</span>
                    <div>
                        Acesse o portal do Governo:
                        <a href="https://assinador.iti.br/assinatura/index.xhtml" target="_blank" rel="noreferrer" className="flex items-center gap-1 font-bold text-blue-600 hover:underline mt-1">
                            gov.br/assinatura <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </li>
                <li className="flex gap-3">
                    <span className="flex items-center justify-center bg-blue-200 w-6 h-6 rounded-full font-bold shrink-0">3</span>
                    <span>Faça o login, anexe os PDFs, assine digitalmente e baixe os arquivos assinados.</span>
                </li>
                <li className="flex gap-3">
                    <span className="flex items-center justify-center bg-blue-200 w-6 h-6 rounded-full font-bold shrink-0">4</span>
                    <span>Faça o upload dos arquivos assinados logo abaixo.</span>
                </li>
            </ol>

            <div className="mt-5 p-3.5 bg-white/60 rounded-lg border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5 leading-relaxed">
                <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
                <p>
                    <strong>Dispensa de Cartório:</strong> A assinatura eletrônica avançada (Gov.br) possui validade legal plena e <strong>dispensa o reconhecimento de firma</strong>, conforme entendimento consolidado pelo STJ (REsp nº 2.243.445).
                </p>
            </div>
        </div>
    );
}