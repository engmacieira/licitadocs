import React from 'react';
import type { CompanyDocumentProps } from './ContractDocument';

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
                    <h3 className="font-bold mt-6 mb-2">1. DOS PODERES ESPECÍFICOS</h3>
                    <p>
                        Pelo presente instrumento particular, a <strong>OUTORGANTE</strong> nomeia e constitui a <strong>OUTORGADA</strong> como sua bastante procuradora, conferindo-lhe poderes específicos, restritos e limitados para representá-la perante órgãos da Administração Pública Direta e Indireta (Federal, Estadual e Municipal), Autarquias, Fundações, Empresas Públicas, Conselhos de Fiscalização Profissional, Receita Federal do Brasil (RFB), Procuradoria-Geral da Fazenda Nacional (PGFN), Caixa Econômica Federal (CEF), Justiça do Trabalho, Justiça Federal, Justiça Estadual e demais entidades competentes.
                    </p>

                    <h3 className="font-bold mt-6 mb-2">2. DA FINALIDADE EXCLUSIVA</h3>
                    <p>
                        Os poderes ora outorgados destinam-se <strong>única e exclusivamente</strong> à consulta, solicitação, acompanhamento, emissão e extração de certidões, atestados e declarações comprobatórias de:
                    </p>
                    <ul className="list-[lower-alpha] pl-6 space-y-1">
                        <li>Regularidade Fiscal e Tributária (âmbito federal, estadual e municipal);</li>
                        <li>Regularidade Trabalhista (CNDT) e Previdenciária;</li>
                        <li>Regularidade relativa ao Fundo de Garantia do Tempo de Serviço (CRF/FGTS);</li>
                        <li>Regularidade Econômico-Financeira (Certidões Negativas de Falência, Concordata e Recuperação Judicial/Extrajudicial);</li>
                        <li>Situação de regularidade junto aos Conselhos de Fiscalização Profissional (CREA, CAU, CRA, entre outros aplicáveis);</li>
                        <li>Demais documentos de habilitação exigidos para a participação em processos licitatórios e contratações públicas, em estrita conformidade com a Lei nº 14.133/2021 (Nova Lei de Licitações e Contratos).</li>
                    </ul>

                    <h3 className="font-bold mt-6 mb-2">3. DA LIMITAÇÃO DE PODERES (CLÁUSULA RESTRITIVA)</h3>
                    <p>
                        Fica <strong>expressamente vedado</strong> à OUTORGADA, sob pena de responsabilização civil e criminal:
                    </p>
                    <ul className="list-none space-y-2">
                        <li><strong>3.1.</strong> Praticar quaisquer atos que importem em assunção de obrigações financeiras, alienação, oneração ou renúncia de direitos em nome da OUTORGANTE;</li>
                        <li><strong>3.2.</strong> Confessar dívidas, firmar acordos, transigir, dar quitação, emitir cheques, movimentar contas bancárias ou assinar contratos em nome da OUTORGANTE;</li>
                        <li><strong>3.3.</strong> Substabelecer os poderes aqui conferidos a terceiros estranhos ao quadro societário ou operacional da OUTORGADA.</li>
                    </ul>

                    <h3 className="font-bold mt-6 mb-2">4. DA VALIDADE E DA RENOVAÇÃO</h3>
                    <ul className="list-none space-y-2">
                        <li><strong>4.1.</strong> O presente instrumento entra em vigor na data de sua assinatura e possui prazo de validade fixo e improrrogável de <strong>1 (um) ano</strong> (12 meses).</li>
                        <li><strong>4.2.</strong> Em caso de renovação da assinatura anual da plataforma ou prorrogação do Contrato Principal de Prestação de Serviços, a continuidade da prestação dos serviços de captação documental ficará estritamente condicionada à emissão e assinatura de um novo Instrumento de Procuração.</li>
                        <li><strong>4.3.</strong> Sem prejuízo do prazo fixado no item 4.1, os poderes ora outorgados serão automática e imediatamente revogados, perdendo todos os seus efeitos de pleno direito, na hipótese de cancelamento, distrato, rescisão ou encerramento antecipado do Contrato Principal de Prestação de Serviços firmado entre as partes.</li>
                    </ul>
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