import React from 'react';

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

                    {/* CLÁUSULA 1 */}
                    <h3 className="font-bold mt-6 mb-2 bg-slate-100 p-1">CLÁUSULA 1ª – DO OBJETO E ESCOPO DO SERVIÇO</h3>
                    <p><strong>1.1. Da Licença de Uso (SaaS):</strong> O presente instrumento tem por objeto a concessão, pela CONTRATADA à CONTRATANTE, de uma licença de uso temporária, revogável, não exclusiva e intransferível do software web denominado <strong>LicitaDocs</strong>, disponibilizado na modalidade <em>Software as a Service</em> (SaaS).</p>
                    <p><strong>1.1.1.</strong> A licença ora concedida não confere à CONTRATANTE qualquer direito de propriedade intelectual sobre o código-fonte, banco de dados, marcas, identidade visual ou arquitetura do sistema.</p>
                    <p><strong>1.2. Da Funcionalidade da Plataforma:</strong> O escopo principal da plataforma compreende a automação da rotina de captação, organização, monitoramento e disponibilização em cofre digital de certidões de regularidade (fiscal, trabalhista, previdenciária e econômico-financeira) e demais documentos de habilitação, visando atender primordialmente aos requisitos estipulados pela Nova Lei de Licitações e Contratos Administrativos (Lei nº 14.133/2021).</p>
                    <p><strong>1.3. Da Limitação por CNPJ:</strong> A licença de uso e a respectiva automação de buscas contratadas estão estritamente vinculadas ao monitoramento de <strong>1 (um) único Cadastro Nacional da Pessoa Jurídica (CNPJ)</strong>, seja ele Matriz ou Filial, devidamente informado e validado no ato do cadastro.</p>
                    <p><strong>1.3.1.</strong> Caso a CONTRATANTE deseje monitorar e gerir a documentação de empresas filiais ou de empresas pertencentes ao mesmo grupo econômico que possuam CNPJs distintos, deverá realizar a contratação de novas assinaturas individualizadas para cada raiz de CNPJ.</p>
                    <p><strong>1.4. Da Exclusão de Escopo:</strong> Para garantir a mais absoluta clareza e segurança jurídica entre as partes, fica expressamente estabelecido que <strong>não</strong> compõem o escopo de serviços deste contrato:</p>
                    <ul className="list-[lower-alpha] pl-6 space-y-1">
                        <li>A prestação de serviços de consultoria jurídica, assessoria contábil, auditoria financeira ou serviços de despachante;</li>
                        <li>A regularização ativa de pendências, débitos ou restrições atreladas ao CNPJ da CONTRATANTE perante os órgãos da Administração Pública;</li>
                        <li>A garantia de sucesso, habilitação ou vitória da CONTRATANTE em qualquer certame licitatório de que venha a participar, sendo a plataforma uma ferramenta facilitadora de gestão documental (obrigação de meio).</li>
                    </ul>

                    {/* CLÁUSULA 2 */}
                    <h3 className="font-bold mt-8 mb-2 bg-slate-100 p-1">CLÁUSULA 2ª – DOS PRAZOS OPERACIONAIS, DINÂMICA DE CAPTAÇÃO E OBRIGAÇÕES</h3>
                    <p><strong>2.1. Do Prazo de Validação e Condições de Liberação (Setup Inicial):</strong> A liberação do acesso definitivo à plataforma e o início da prestação dos serviços de captação documental estão estritamente condicionados à validação de conformidade cadastral e jurídica. A equipe técnica da CONTRATADA terá o prazo de até <strong>48 (quarenta e oito) horas úteis</strong> para analisar e validar os seguintes requisitos cumulativos:</p>
                    <ul className="list-[lower-alpha] pl-6 space-y-1">
                        <li>A confirmação do registro sistêmico do Termo de Aceite prévio;</li>
                        <li>A efetiva compensação e aprovação do pagamento da assinatura anual pelo <em>gateway</em>;</li>
                        <li>O preenchimento completo, correto e verídico de todos os dados cadastrais da CONTRATANTE na plataforma;</li>
                        <li>A devida formalização e assinatura digital do Contrato Principal e do Instrumento de Procuração por representante legal que possua poderes expressos para tal (validação mediante conferência com o Contrato Social anexado).</li>
                    </ul>
                    <p><strong>2.1.1. Das Inconsistências na Validação:</strong> Caso seja identificada qualquer pendência, erro de preenchimento ou assinatura por pessoa sem poderes de representação, a CONTRATADA notificará a CONTRATANTE para regularização. O prazo estipulado no item 2.1 será pausado e sua contagem reiniciada apenas após a correção definitiva pela CONTRATANTE.</p>
                    <p><strong>2.2. Do Prazo de Captação e Inserção:</strong> Apenas após a conclusão com sucesso de todas as etapas de verificação listadas na Cláusula 2.1, iniciar-se-á o novo prazo de <strong>48 (quarenta e oito) horas úteis</strong> para que a CONTRATADA realize a busca, captação e inserção das certidões de regularidade iniciais no cofre digital da CONTRATANTE.</p>
                    <p><strong>2.3. Da Inteligência de Busca Vinculada ao Objeto:</strong> A captação do acervo de certidões será parametrizada com base no Objeto Social da CONTRATANTE (conforme descrito em seu Contrato Social e CNAEs), garantindo que a documentação disponibilizada seja aderente e suficiente para a participação em processos licitatórios compatíveis com o seu ramo de atuação.</p>
                    <p><strong>2.4. Das Exceções aos Prazos de Emissão:</strong> O prazo estipulado no item 2.2 poderá ser estendido exclusivamente para certidões de âmbito municipal ou documentos cuja emissão pelo órgão público dependa de análise humana, processos físicos ou prazos próprios da autarquia.</p>
                    <p><strong>2.4.1.</strong> Nestes cenários, a obrigação da CONTRATADA restringe-se a comprovar que a solicitação ou o protocolo junto ao respectivo órgão foi realizado dentro do prazo original de 48 (quarenta e oito) horas.</p>
                    <p><strong>2.5. Da Renovação Ativa (Monitoramento Contínuo):</strong> Durante a vigência deste contrato, a CONTRATADA realizará ativamente o processo de renovação das certidões monitoradas. A busca pelas novas emissões será executada em até <strong>8 (oito) dias corridos</strong> antes da data de vencimento do documento vigente, garantindo a continuidade da regularidade no cofre digital.</p>
                    <p><strong>2.6. Da Constatação de Irregularidades Impeditivas:</strong> Se, durante o processo de emissão ou renovação, for constatada qualquer irregularidade, pendência ou débito que impeça a emissão da certidão, a plataforma suspenderá a busca daquele documento específico e notificará a CONTRATANTE pelos canais oficiais.</p>
                    <p><strong>2.6.1.</strong> Conforme estabelecido na exclusão de escopo, a CONTRATADA não assumirá a responsabilidade de regularizar a pendência, cabendo à CONTRATANTE sanar a irregularidade junto ao órgão para que a plataforma possa retomar a captação.</p>
                    <p><strong>2.7. Dos Documentos de Inserção Exclusiva da CONTRATANTE:</strong> A plataforma não realizará a busca ou elaboração de documentos de natureza contábil, privada ou que exijam assinatura de próprio punho. Fica sob a responsabilidade exclusiva da CONTRATANTE a inserção manual no cofre digital de:</p>
                    <ul className="list-[lower-alpha] pl-6 space-y-1">
                        <li>Balanços Patrimoniais e Demonstrações Contábeis;</li>
                        <li>Declarações específicas exigidas em editais.</li>
                    </ul>
                    <p><strong>2.7.1.</strong> Para facilitar a rotina, a CONTRATADA disponibilizará na plataforma modelos padronizados das declarações exigidas pela Lei 14.133/21 para <em>download</em>, devendo a CONTRATANTE preenchê-los, assiná-los e realizar o respectivo <em>upload</em> em campo próprio.</p>

                    {/* CLÁUSULA 3 */}
                    <h3 className="font-bold mt-8 mb-2 bg-slate-100 p-1">CLÁUSULA 3ª – DA GESTÃO DE USUÁRIOS E LIMITES DO COFRE DIGITAL</h3>
                    <p><strong>3.1. Dos Perfis de Acesso (ACL):</strong> Para a operação e visualização do cofre digital, a plataforma adota um sistema de controle de acessos estruturado da seguinte forma:</p>
                    <p><strong>3.1.1. Usuário Master (Administrador):</strong> No ato do cadastro, a CONTRATANTE criará 1 (um) perfil principal, gerido pelo administrador legal ou procurador constituído. Este perfil detém plenos poderes para alimentar os dados cadastrais da empresa, assinar eletronicamente os documentos, outorgar procurações e gerenciar a conta.</p>
                    <p><strong>3.1.2. Usuários Adicionais (Somente Leitura):</strong> O Usuário Master terá o direito de cadastrar até <strong>3 (três) usuários adicionais</strong> vinculados ao mesmo CNPJ. Estes perfis secundários possuirão permissões restritas exclusivamente à consulta, visualização e <em>download</em> das certidões e documentos armazenados, sendo tecnicamente bloqueados para realizar alterações sistêmicas, exclusões ou uploads.</p>
                    <p><strong>3.2. Da Finalidade Estrita do Cofre Digital:</strong> O ambiente de armazenamento em nuvem fornecido pela plataforma destina-se única e exclusivamente à guarda e organização de documentos com finalidade habilitatória para processos licitatórios (Lei nº 14.133/2021). O cofre digital não configura, sob nenhuma hipótese, um serviço de disco virtual de uso genérico corporativo.</p>
                    <p><strong>3.3. Da Restrição e Localização de Uploads Manuais:</strong> A CONTRATANTE está autorizada a realizar o <em>upload</em> manual no sistema <strong>apenas e estritamente</strong> dos documentos oficiais listados abaixo, os quais deverão ser inseridos obrigatoriamente em seus respectivos campos e abas designadas na plataforma:</p>
                    <ul className="list-[lower-alpha] pl-6 space-y-1">
                        <li>Contrato Social, Estatuto ou Requerimento de Empresário (sendo obrigação da CONTRATANTE manter sempre anexada a última alteração consolidada);</li>
                        <li>Comprovante de Inscrição e de Situação Cadastral (Cartão CNPJ), exigido prioritariamente no momento do cadastro inicial;</li>
                        <li>Documento Pessoal de Identificação com foto (RG, CNH ou identidade profissional) do representante legal cadastrado como Usuário Master;</li>
                        <li>Instrumento de Procuração atualizado do representante (quando a representação for delegada a terceiros);</li>
                        <li>Balanços Patrimoniais e Demonstrações Contábeis, a serem anexados exclusivamente no campo próprio de Qualificação Econômico-Financeira;</li>
                        <li>Declarações específicas exigidas em editais (ex: Declaração de não emprego de menor, Declaração de superveniência de fatos impeditivos).</li>
                    </ul>
                    <p><strong>3.3.1.</strong> Para facilitar a rotina, a CONTRATADA disponibilizará na plataforma modelos padronizados das declarações exigidas pela Lei 14.133/21 para <em>download</em>, devendo a CONTRATANTE preenchê-los, assiná-los e realizar o <em>upload</em> correspondente.</p>
                    <p><strong>3.4. Da Exclusão Permanente de Arquivos Não Autorizados:</strong> Fica expressamente pactuado que qualquer outro documento, imagem, planilha ou arquivo anexado manualmente pela CONTRATANTE que fuja ao escopo taxativo da Cláusula 3.3 será considerado uso indevido da infraestrutura.</p>
                    <p><strong>3.4.1.</strong> Nestes casos, a equipe de administração da CONTRATADA reserva-se o direito de excluir permanentemente tais arquivos da base de dados e dos servidores de armazenamento, a qualquer tempo e sem a necessidade de aviso ou notificação prévia à CONTRATANTE.</p>

                    {/* CLÁUSULA 4 */}
                    <h3 className="font-bold mt-8 mb-2 bg-slate-100 p-1">CLÁUSULA 4ª – DO PREÇO, CONDIÇÕES DE PAGAMENTO E LIBERAÇÃO DE ACESSO</h3>
                    <p><strong>4.1. Do Valor da Assinatura Anual:</strong> Pela licença de uso do software e prestação dos serviços atrelados ao monitoramento de 1 (um) único CNPJ, a CONTRATANTE pagará à CONTRATADA o valor total de <strong>R$ 178,80</strong> (cento e setenta e oito reais e oitenta centavos), correspondente ao ciclo de vigência de <strong>12 (doze) meses</strong> de acesso.</p>
                    <p><strong>4.2. Das Formas e Meios de Pagamento:</strong> O pagamento deverá ser efetuado no momento da contratação, diretamente no ambiente seguro da plataforma, sendo processado exclusivamente pelo gateway de pagamentos <em>Infinity Pay</em>.</p>
                    <p><strong>4.2.1.</strong> A CONTRATADA disponibiliza e aceita as seguintes modalidades para a quitação do valor anual:</p>
                    <ul className="list-[lower-alpha] pl-6 space-y-1">
                        <li>Pagamento à vista, em parcela única, mediante PIX ou Cartão de Débito;</li>
                        <li>Pagamento parcelado em até 12 (doze) vezes, efetuado de forma exclusiva via Cartão de Crédito (sujeito às condições e regras de parcelamento da respectiva operadora).</li>
                    </ul>
                    <p><strong>4.3. Da Natureza Pré-Paga e Liberação do Serviço:</strong> O modelo de contratação do sistema LicitaDocs possui natureza estritamente pré-paga. A liberação do ambiente logado (cofre digital) para a CONTRATANTE e o início da contagem dos prazos operacionais de validação e captação (descritos na Cláusula 2ª) estão estritamente condicionados à efetiva compensação e aprovação sistêmica do pagamento pelo gateway <em>Infinity Pay</em>.</p>
                    <p><strong>4.4. Da Inadimplência e Ausência de Encargos Moratórios:</strong> Tendo em vista o modelo de faturamento sistêmico e pré-pago, fica estabelecido que não haverá a incidência de multas moratórias, juros de mora ou o envio do nome da CONTRATANTE aos órgãos de proteção ao crédito (SPC/Serasa) em decorrência de não pagamento.</p>
                    <p><strong>4.4.1.</strong> A ausência de confirmação do pagamento inicial, a recusa da transação por parte da operadora do cartão de crédito ou a não quitação do código PIX gerado implicará, única e exclusivamente, na não ativação da assinatura ou na suspensão automática dos serviços (em caso de tentativa de renovação), não gerando acúmulo de dívidas ou passivos para a CONTRATANTE.</p>

                    {/* CLÁUSULA 5 */}
                    <h3 className="font-bold mt-8 mb-2 bg-slate-100 p-1">CLÁUSULA 5ª – DA DISPONIBILIDADE (SLA) E SUPORTE TÉCNICO</h3>
                    <p><strong>5.1. Do Nível de Serviço (SLA - Service Level Agreement):</strong> A CONTRATADA compromete-se a empreender seus melhores esforços técnicos e operacionais para manter a plataforma LicitaDocs acessível e funcional, garantindo um índice de disponibilidade mínima (Uptime) de <strong>99% (noventa e nove por cento)</strong> ao mês.</p>
                    <p><strong>5.2. Das Exclusões de Responsabilidade do SLA:</strong> Para fins de apuração da disponibilidade estipulada no item 5.1, não serão computadas como tempo de inatividade ou falha da plataforma as interrupções decorrentes de:</p>
                    <ul className="list-[lower-alpha] pl-6 space-y-1">
                        <li>Instabilidade, lentidão, manutenção ou inoperância (quedas) de portais, sistemas, bancos de dados e APIs pertencentes a órgãos da Administração Pública e emissores de certidões;</li>
                        <li>Falhas sistêmicas, quedas de energia, indisponibilidade de roteamento ou paralisação dos servidores de infraestrutura em nuvem (como a <em>Amazon Web Services - AWS</em>) onde a plataforma encontra-se hospedada;</li>
                        <li>Manutenções técnicas programadas na plataforma LicitaDocs, desde que comunicadas previamente à CONTRATANTE por meio de avisos no painel ou e-mail;</li>
                        <li>Eventos de força maior ou caso fortuito (art. 393 do Código Civil Brasileiro).</li>
                    </ul>
                    <p><strong>5.3. Dos Canais Oficiais de Atendimento:</strong> O suporte técnico, operacional e o esclarecimento de dúvidas serão prestados à CONTRATANTE exclusivamente por meio dos canais oficiais da plataforma:</p>
                    <ul className="list-[lower-alpha] pl-6 space-y-1">
                        <li>E-mail de suporte;</li>
                        <li>Aplicativo de mensagens WhatsApp;</li>
                        <li>Abertura de chamados (Tickets) diretamente via sistema.</li>
                    </ul>
                    <p><strong>5.3.1.</strong> A relação atualizada dos contatos, números e links de acesso aos referidos canais de comunicação encontra-se permanentemente disponível em página específica na área logada da plataforma.</p>
                    <p><strong>5.4. Do Horário de Atendimento e Prazo de Resposta:</strong> O atendimento da equipe de suporte ocorrerá estritamente em <strong>dias úteis</strong>, de segunda a sexta-feira, compreendido no horário comercial das <strong>08h00 às 18h00</strong> (horário de Brasília).</p>
                    <p><strong>5.4.1.</strong> O prazo máximo para a primeira resposta da equipe técnica a um chamado ou solicitação será de até <strong>24 (vinte e quatro) horas corridas</strong>, desde que tal lapso temporal transcorra dentro dos dias e horários úteis definidos na Cláusula 5.4.</p>
                    <p><strong>5.5. Do Calendário de Feriados Oficiais:</strong> Fica estabelecido que o suporte técnico e a contagem de prazos operacionais serão suspensos durante feriados nacionais, feriados estaduais do Estado de Minas Gerais e feriados municipais da sede da CONTRATADA (Braúnas/MG).</p>
                    <p><strong>5.5.1.</strong> A relação integral dos feriados observados pela operação da CONTRATADA será mantida atualizada e disponível para consulta da CONTRATANTE na mesma página de links dos canais oficiais de comunicação do sistema.</p>

                    {/* CLÁUSULA 6 */}
                    <h3 className="font-bold mt-8 mb-2 bg-slate-100 p-1">CLÁUSULA 6ª – DO ARMAZENAMENTO E RETENÇÃO DE DADOS</h3>
                    <p><strong>6.1. Do Armazenamento Durante a Vigência:</strong> Durante todo o período de vigência deste contrato, a CONTRATADA compromete-se a manter armazenadas, seguras e disponíveis para consulta e <em>download</em> todas as informações, certidões captadas e documentos anexados pela CONTRATANTE.</p>
                    <p><strong>6.1.1.</strong> Para fins de organização, clareza visual e auditoria, o cofre digital exibirá as certidões com status válido (vigentes) em sua interface principal (link principal), enquanto os documentos expirados (vencidos) serão automaticamente movidos e permanecerão acessíveis em um link ou diretório específico de histórico.</p>
                    <p><strong>6.2. Do Prazo de Retenção por Término Normal do Contrato:</strong> Ocorrendo o término do período contratual (12 meses) sem que haja a renovação imediata da assinatura, a plataforma manterá o cofre digital e todos os seus arquivos disponíveis para a CONTRATANTE realizar o <em>download</em> e backup pelo prazo improrrogável de <strong>15 (quinze) dias corridos</strong>.</p>
                    <p><strong>6.2.1.</strong> Caso a CONTRATANTE efetue o pagamento da renovação dentro deste período de carência de 15 dias, o acervo documental permanecerá intacto e disponível para consulta, retomando-se o ciclo de monitoramento contínuo.</p>
                    <p><strong>6.2.2.</strong> Esgotado o prazo de 15 dias sem a efetivação da renovação, a CONTRATADA fica plenamente autorizada a excluir os documentos e dados corporativos de sua base de dados a qualquer momento, de forma definitiva e irreversível, sem necessidade de notificação adicional.</p>
                    <p><strong>6.3. Do Prazo de Retenção por Rescisão ou Cancelamento Antecipado:</strong> Na hipótese de a CONTRATANTE solicitar o cancelamento voluntário ou a rescisão antecipada da assinatura antes do término do ciclo de 12 meses, o prazo para acesso e <em>download</em> de todo o acervo documental será reduzido para <strong>5 (cinco) dias corridos</strong>, contados a partir da data da solicitação de cancelamento.</p>
                    <p><strong>6.3.1.</strong> Findo este prazo estrito de 5 dias, a plataforma procederá com a exclusão definitiva e permanente dos arquivos de seus servidores, não cabendo à CONTRATANTE qualquer pedido de recuperação ou indenização por perda de dados documentais.</p>

                    {/* CLÁUSULA 7 */}
                    <h3 className="font-bold mt-8 mb-2 bg-slate-100 p-1">CLÁUSULA 7ª – DO PRAZO, RENOVAÇÃO E CANCELAMENTO (CHURN)</h3>
                    <p><strong>7.1. Da Vigência:</strong> O presente contrato entra em vigor na data de compensação e aprovação do pagamento inicial pelo gateway, possuindo validade fixa e ininterrupta de <strong>1 (um) ano (12 meses)</strong>.</p>
                    <p><strong>7.2. Do Aviso Prévio de Vencimento e Renovação:</strong> A fim de garantir a transparência da relação comercial, a plataforma LicitaDocs enviará notificações automáticas à CONTRATANTE, por meio de seus canais oficiais de comunicação cadastrados, com <strong>60 (sessenta) dias de antecedência</strong> da data de término da assinatura, informando a proximidade do vencimento e o passo a passo para a renovação.</p>
                    <p><strong>7.3. Da Ausência de Renovação Automática:</strong> Fica expressamente pactuado que <strong>não haverá renovação automática</strong> da assinatura. Caberá exclusivamente à CONTRATANTE acessar a plataforma e providenciar o pagamento de um novo ciclo anual.</p>
                    <p><strong>7.3.1.</strong> Conforme estabelecido na Cláusula 6ª, a CONTRATANTE terá um prazo de tolerância de até <strong>15 (quinze) dias corridos após o vencimento</strong> para efetivar a renovação. A ausência de renovação neste prazo acarretará o encerramento definitivo da prestação de serviços e a exclusão da base de dados.</p>
                    <p><strong>7.4. Da Rescisão Antecipada e Cancelamento:</strong> A CONTRATANTE poderá solicitar o cancelamento voluntário da assinatura a qualquer momento antes do término dos 12 (doze) meses contratados, mediante solicitação formal via plataforma.</p>
                    <p><strong>7.4.1.</strong> Em caso de cancelamento antecipado, a CONTRATANTE fará jus ao reembolso proporcional do período não utilizado, sobre o qual incidirá multa rescisória compensatória em favor da CONTRATADA, calculada estritamente conforme a seguinte fórmula matemática:</p>
                    <ul className="list-[lower-alpha] pl-6 space-y-1">
                        <li>Deduz-se, primeiramente, 10% (dez por cento) do valor total pago anualmente, a título de custeio irrecuperável de taxas da operadora de pagamento;</li>
                        <li>O saldo resultante (90% do valor anual) é dividido por 12 (doze), encontrando-se a base de cálculo mensal líquida;</li>
                        <li>Multiplica-se esta base mensal líquida exclusivamente pelos <strong>meses inteiros</strong> restantes para o fim do contrato;</li>
                        <li>Sobre o montante final apurado, aplica-se o fator multiplicador de 0,5 (cinquenta por cento), que será retido pela CONTRATADA a título de multa por quebra de fidelidade, sendo o valor remanescente devolvido à CONTRATANTE.</li>
                    </ul>
                    <p><strong>7.5. Do Cômputo de Meses Utilizados:</strong> Para fins do cálculo estipulado no item 7.4.1, alínea "c", qualquer fração de mês em que a plataforma esteve disponível para a CONTRATANTE (mesmo que por apenas 1 dia após o ciclo mensal virar) será considerada como mês integralmente consumido, não sendo contabilizada como "mês restante" para fins de reembolso.</p>

                    {/* CLÁUSULA 8 */}
                    <h3 className="font-bold mt-8 mb-2 bg-slate-100 p-1">CLÁUSULA 8ª – DA FORMALIZAÇÃO, DISPOSIÇÕES GERAIS E FORO</h3>
                    <p><strong>8.1. Da Formalização e Assinatura Digital do Contrato:</strong> Diferentemente do "Termo de Aceite e Condições Prévias de Uso" (cuja anuência ocorre via sistema mediante clique e registro de <em>log</em>), o presente Contrato Principal exige formalização expressa. A CONTRATANTE deverá realizar o <em>download</em> da presente minuta, assiná-la digitalmente e efetuar o <em>upload</em> do arquivo assinado no campo correspondente dentro da plataforma LicitaDocs.</p>
                    <p><strong>8.1.1.</strong> Para fins de validade e segurança jurídica, a CONTRATADA recomenda expressamente a utilização da <strong>assinatura eletrônica avançada do portal GOV.BR</strong> (válida nos termos da Lei nº 14.063/2020) ou de assinatura digital com certificado padrão ICP-Brasil pelo representante legal da CONTRATANTE.</p>
                    <p><strong>8.1.2.</strong> A não inserção (<em>upload</em>) do contrato devidamente assinado nos moldes e prazos exigidos pela plataforma poderá acarretar a suspensão dos serviços até a devida regularização.</p>
                    <p><strong>8.2. Da Independência das Cláusulas:</strong> A eventual declaração de nulidade ou invalidade de qualquer das cláusulas deste contrato não afetará a validade e a eficácia das demais disposições, que permanecerão em pleno vigor.</p>
                    <p><strong>8.3. Da Tolerância:</strong> A tolerância ou o não exercício, por qualquer das partes, de direitos a ela assegurados neste contrato não importará em novação ou renúncia, podendo a parte exercê-los a qualquer tempo.</p>
                    <p><strong>8.4. Das Alterações Contratuais:</strong> A CONTRATADA poderá alterar os termos de prestação de serviços para adaptá-los a inovações tecnológicas ou mudanças na legislação aplicável (como atualizações da Lei 14.133/2021). Quaisquer alterações serão comunicadas à CONTRATANTE com antecedência mínima de 15 (quinze) dias, exigindo-se, caso haja mudança substancial de escopo, a assinatura de um novo aditivo contratual.</p>
                    <p><strong>8.5. Do Foro de Eleição:</strong> Para dirimir quaisquer controvérsias, dúvidas ou litígios oriundos da interpretação ou execução do presente Contrato de Prestação de Serviços, as partes elegem o foro da Comarca de domicílio da CONTRATADA (Braúnas/MG), com expressa renúncia a qualquer outro, por mais privilegiado que seja ou venha a ser.</p>
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