import React from 'react';
import { ContractContent } from './ContractContent';

/**
 * Propriedades injetadas no documento do contrato para preenchimento dinâmico.
 * @interface CompanyDocumentProps
 */
export interface CompanyDocumentProps {
    razaoSocial: string;
    cnpj: string;
    endereco: string;
    cidade: string;
    estado: string;
    responsavel: string;
    cpfResponsavel: string;
    genero?: string;
    rg?: string;
    nacionalidade?: string;
    estado_civil?: string;
    profissao?: string;
}

/**
 * Componente que renderiza a estrutura completa do Contrato Principal.
 * Inclui cabeçalho, qualificação das partes, o conteúdo (ContractContent) e a área de assinaturas.
 * Utiliza forwardRef para permitir a impressão ou geração de PDF pelo componente pai.
 */
export const ContractDocument = React.forwardRef<HTMLDivElement, CompanyDocumentProps>(
    ({ razaoSocial, cnpj, endereco, responsavel, cpfResponsavel, genero, rg, nacionalidade, estado_civil, profissao }, ref) => {

        // UX: Gerando a data dinamicamente para o momento da impressão
        const hoje = new Date();
        const dia = hoje.getDate();
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const mes = meses[hoje.getMonth()];
        const ano = hoje.getFullYear();

        // 🧠 LÓGICA DE GÊNERO / PRONOMES
        const g = genero?.toLowerCase().trim() || '';
        const isMasc = g === 'masculino' || g === 'm';
        const isFem = g === 'feminino' || g === 'f';

        const pAdmin = isMasc ? 'administrador legal' : isFem ? 'administradora legal' : 'administrador(a) legal';
        const pPortador = isMasc ? 'portador' : isFem ? 'portadora' : 'portador(a)';
        const pInscrito = isMasc ? 'inscrito' : isFem ? 'inscrita' : 'inscrito(a)';

        const defNac = nacionalidade || 'brasileiro(a)';
        const defEstCivil = estado_civil || 'estado civil';
        const defProf = profissao || 'empresário(a)';
        const defRg = rg || '___.___.___-__';

        return (
            <div ref={ref} className="bg-white p-10 md:p-20 text-sm font-serif leading-relaxed text-slate-900 max-w-[21cm] mx-auto shadow-sm border border-slate-200 min-h-[29.7cm]">

                {/* Cabeçalho */}
                <div className="text-center mb-12">
                    <h1 className="text-xl font-bold uppercase underline decoration-2 underline-offset-4 mb-2">
                        Contrato de Prestação de Serviços de Tecnologia
                    </h1>
                    <h2 className="text-lg font-bold uppercase">Plataforma LicitaDocs</h2>
                </div>

                {/* Qualificação das Partes */}
                <div className="space-y-6 text-justify">
                    <p>
                        Pelo presente instrumento particular, de um lado:
                    </p>
                    <p>
                        <strong>CONTRATADA:</strong> <strong>LICITADOCS TECNOLOGIA S.A.</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 12.345.678/0001-90, com sede na Avenida da Inovação, nº 1000, Edifício Tech, São Paulo/SP, neste ato representada na forma do seu Contrato Social;
                    </p>
                    <p>
                        E, de outro lado:
                    </p>
                    <p>
                        <strong>CONTRATANTE:</strong> <strong>{razaoSocial}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {cnpj}, com sede em {endereco}, neste ato representada por seu {pAdmin}, <strong>{responsavel}</strong>, {defNac}, {defEstCivil}, {defProf}, {pPortador} do RG nº {defRg} e {pInscrito} no CPF sob o nº {cpfResponsavel}.
                    </p>
                    <p>
                        As Partes acima identificadas celebram o presente Contrato de Prestação de Serviços de Tecnologia em nuvem (SaaS), o qual se regerá pelas cláusulas e condições a seguir estipuladas.
                    </p>
                </div>

                <div className="border-t border-slate-300 my-8"></div>

                {/* Corpo do Contrato centralizado */}
                <div className="text-justify">
                    <ContractContent />
                </div>

                {/* Fechamento e Assinaturas */}
                <div className="mt-16 break-inside-avoid">
                    <p className="text-justify mb-12">
                        E, por estarem assim justas e contratadas, as Partes firmam o presente instrumento em formato digital, reconhecendo a validade das assinaturas eletrônicas aqui apostas.
                    </p>

                    <p className="text-center mb-12">
                        São Paulo/SP, {dia} de {mes} de {ano}.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center mb-12">
                        <div className="border-t border-slate-900 pt-3">
                            <p className="font-bold">{razaoSocial}</p>
                            <p className="text-xs">CNPJ: {cnpj}</p>
                            <p className="text-xs">Representada por: {responsavel}</p>
                            <p className="text-xs italic text-slate-600 mt-2">(Assinatura Digital / Eletrônica com validade jurídica)</p>
                        </div>

                        <div className="border-t border-slate-900 pt-3">
                            <p className="font-bold">LICITADOCS TECNOLOGIA S.A.</p>
                            <p className="text-xs">CNPJ: 39.672.264/0001-27</p>
                            <p className="text-xs">Representada por: MATHEUS HENRIQUE MACIEIRA</p>
                            <p className="text-xs italic text-slate-600 mt-2">(Assinatura Digital / Eletrônica com validade jurídica)</p>
                        </div>
                    </div>

                    {/* Testemunhas */}
                    <p className="font-bold mb-6 text-center">Testemunhas:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center">
                        <div className="border-t border-slate-900 pt-3">
                            <p className="font-bold text-slate-400">[NOME DA TESTEMUNHA 1]</p>
                            <p className="text-xs text-slate-400">CPF: [000.000.000-00]</p>
                            <p className="text-xs italic text-slate-400 mt-2">(Assinatura Digital / Eletrônica)</p>
                        </div>

                        <div className="border-t border-slate-900 pt-3">
                            <p className="font-bold text-slate-400">[NOME DA TESTEMUNHA 2]</p>
                            <p className="text-xs text-slate-400">CPF: [000.000.000-00]</p>
                            <p className="text-xs italic text-slate-400 mt-2">(Assinatura Digital / Eletrônica)</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);
ContractDocument.displayName = 'ContractDocument';