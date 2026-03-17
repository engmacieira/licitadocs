import React from 'react';
import { ContractContent } from './ContractContent';

// 1. Interface atualizada com RG e Gênero
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

        // Definindo as palavras baseadas no gênero
        const pSeu = isMasc ? 'seu' : isFem ? 'sua' : 'seu(sua)';
        const pInscrito = isMasc ? 'inscrito' : isFem ? 'inscrita' : 'inscrito(a)';
        const pPortador = isMasc ? 'portador' : isFem ? 'portadora' : 'portador(a)';

        return (
            <div ref={ref} className="bg-white p-10 shadow-md max-w-[21cm] w-full text-sm font-serif leading-relaxed text-slate-900 mx-auto print:text-[12px]">

                {/* Título Principal */}
                <h2 className="text-center font-bold text-lg mb-8 uppercase underline decoration-2 underline-offset-4">
                    Contrato Prestação de Serviços de Tecnologia e Gestão Documental – LicitaDocs
                </h2>

                <div className="space-y-4 text-justify">

                    {/* Qualificação das Partes */}
                    <p>
                        Por este instrumento particular, de um lado, a <strong>CONTRATADA</strong>:<br />
                        <strong>39.672.264 MATHEUS HENRIQUE MACIEIRA - ME</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 39.672.264/0001-27, com sede na Fazenda Lages, s/n, zona rural, Braúnas/MG, neste ato representada por seu titular, <strong>MATHEUS HENRIQUE MACIEIRA</strong>, brasileiro, casado, empresário, portador da Cédula de Identidade RG nº MG-15.999.624 e inscrito no CPF sob o nº 105.723.796-50.
                    </p>

                    <p>
                        E de outro lado, a <strong>CONTRATANTE</strong>:<br />
                        <strong>{razaoSocial}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {cnpj}, com sede em {endereco}, devidamente qualificada no formulário eletrônico de adesão e neste ato representada por {pSeu} Usuário Master (Administrador Legal ou Procurador), <strong>{responsavel}</strong>, {nacionalidade || '[Nacionalidade]'}, {estado_civil || '[Estado Civil]'}, {profissao || '[Profissão]'}, {pPortador} da Cédula de Identidade RG nº {rg || '[Número do RG]'} e {pInscrito} no CPF sob o nº {cpfResponsavel}.
                    </p>

                    <p className="mb-6">
                        As partes resolvem firmar o presente Contrato de Prestação de Serviços, regido pelas cláusulas e condições a seguir:
                    </p>

                    {/* Divisor Visual */}
                    <div className="border-t border-slate-300 my-6"></div>

                    <ContractContent />

                </div>

                {/* BLOCO DE ASSINATURAS - Prevenindo quebra de página na impressão */}
                <div className="mt-16 print:break-inside-avoid">
                    <p className="mb-8 text-center">
                        Braúnas/MG, {dia} de {mes} de {ano}.
                    </p>

                    {/* Grid para Contratada e Contratante */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center mb-12">
                        <div className="border-t border-slate-900 pt-3">
                            <p className="font-bold">{razaoSocial}</p>
                            <p className="text-xs">CNPJ: {cnpj}</p>
                            <p className="text-xs">Representada por: {responsavel}</p>
                            <p className="text-xs italic text-slate-600 mt-2">(Assinatura Digital / Eletrônica com validade jurídica)</p>
                        </div>

                        <div className="border-t border-slate-900 pt-3">
                            <p className="font-bold">39.672.264 MATHEUS HENRIQUE MACIEIRA - ME</p>
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