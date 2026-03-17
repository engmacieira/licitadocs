import React from 'react';
import type { CompanyDocumentProps } from './ContractDocument';
import { ProxyContent } from './ProxyContent';

export const ProxyDocument = React.forwardRef<HTMLDivElement, CompanyDocumentProps>(
    ({ razaoSocial, cnpj, endereco, responsavel, cpfResponsavel, genero, nacionalidade, estado_civil, profissao, rg, cidade, estado }, ref) => {

        // UX: Gerando a data dinamicamente
        const hoje = new Date();
        const dia = hoje.getDate();
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const mes = meses[hoje.getMonth()];
        const ano = hoje.getFullYear();

        // 🧠 LÓGICA DE GÊNERO / PRONOMES
        const g = genero?.toLowerCase().trim() || '';
        const isMasc = g === 'masculino' || g === 'm';
        const isFem = g === 'feminino' || g === 'f';

        const pSeu = isMasc ? 'seu' : isFem ? 'sua' : 'seu(sua)';
        const pAdmin = isMasc ? 'administrador legal' : isFem ? 'administradora legal' : 'administrador(a) legal';
        const pSr = isMasc ? 'Sr.' : isFem ? 'Sra.' : 'Sr(a).';
        const pPortador = isMasc ? 'portador' : isFem ? 'portadora' : 'portador(a)';
        const pInscrito = isMasc ? 'inscrito' : isFem ? 'inscrita' : 'inscrito(a)';

        return (
            <div ref={ref} className="bg-white p-10 shadow-md max-w-[21cm] w-full text-sm font-serif leading-relaxed text-slate-900 mx-auto print:text-[12px]">

                <h2 className="text-center font-bold text-lg mb-8 uppercase underline decoration-2 underline-offset-4">
                    Instrumento Particular de Procuração com Poderes Específicos
                </h2>

                <div className="space-y-5 text-justify">
                    <p>
                        <strong>OUTORGANTE (CONTRATANTE):</strong><br />
                        <strong>{razaoSocial}</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº {cnpj}, com sede na {endereco}, neste ato representada, nos termos do seu Contrato Social, por {pSeu} {pAdmin}, {pSr} <strong>{responsavel}</strong>, {nacionalidade || '[Nacionalidade]'}, {estado_civil || '[Estado Civil]'}, {profissao || '[Profissão]'}, {pPortador} da Cédula de Identidade RG nº {rg || '[Número do RG]'} e {pInscrito} no CPF sob o nº {cpfResponsavel}.
                    </p>

                    <p>
                        <strong>OUTORGADA (CONTRATADA / PLATAFORMA LICITADOCS):</strong><br />
                        <strong>39.672.264 MATHEUS HENRIQUE MACIEIRA - ME</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 39.672.264/0001-27, com sede na Fazenda Lages, s/n, zona rural, Braúnas/MG, neste ato representada por seu titular, <strong>MATHEUS HENRIQUE MACIEIRA</strong>, brasileiro, casado, empresário, portador da Cédula de Identidade RG nº MG-15.999.624 e inscrito no CPF sob o nº 105.723.796-50.
                    </p>

                    {/* Divisor Visual */}
                    <div className="border-t border-slate-300 my-6"></div>

                    {/* Cláusulas mantidas intactas */}

                    <ProxyContent />

                </div>

                {/* Bloco de Assinatura */}
                <div className="mt-20 text-center">
                    <p className="mb-12">
                        {cidade}/{estado}, {dia} de {mes} de {ano}.
                    </p>
                    <div className="max-w-md mx-auto border-t border-slate-900 pt-3">
                        <p className="font-bold">{razaoSocial}</p>
                        <p className="text-xs">CNPJ: {cnpj}</p>
                        <p className="text-xs">Representada por: {responsavel}</p>
                        <p className="text-xs italic text-slate-600 mt-2">(Assinatura Digital / Eletrônica com validade jurídica)</p>
                    </div>
                </div>

            </div>
        );
    }
);
ProxyDocument.displayName = 'ProxyDocument';