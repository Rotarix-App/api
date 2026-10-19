# Análise documental e pendências

Leitura inicial dos três originais realizada em 18/10/2026. As abreviações TAP, ER e PI e seus links estão no [contexto](../CONTEXTO_GERAL.md). Este documento organiza a análise sem alterar os originais. A pasta existente `requesitos/` foi mantida.

## Requisitos funcionais e rastreabilidade de leitura

A associação abaixo segue o conteúdo dos casos de uso. É uma análise, não uma correção aprovada da matriz oficial.

| RF | Conteúdo e validações principais | UC pelo conteúdo |
|---|---|---|
| RF01 | Cadastro Gestor/Motorista; nome, e-mail, senha, telefone obrigatórios; CNH e categoria para motorista; e-mail único; perfil imutável; encaminhamento à tela do perfil | UC01 |
| RF02 | Login e-mail/senha, validação de credenciais, mensagens e acesso à área principal | UC01 |
| RF03 | Visualizar/editar nome, e-mail e telefone; alterar senha com senha atual e confirmação; logout; confirmar exclusão; CNH somente leitura; anonimizar histórico ao excluir motorista | UC01 |
| RF04 | Criar/editar/desativar/reativar/excluir frota; nome/base/região obrigatórios; buscar por nome e filtrar status; confirmar exclusão digitando nome; desvincular veículos e remover atribuições | UC02 |
| RF05 | Gestão de veículo; placa/marca/modelo/ano/frota obrigatórios; placa única; alerta de revisão por km; não desativar em viagem; confirmar exclusão digitando placa | UC03 |
| RF06 | Gestão de motorista; nome/e-mail/telefone/CNH/categoria obrigatórios; busca nome/CNH e filtro status; desativação em viagem permitida com alerta; exclusão confirmada preservando histórico anônimo | UC04 |
| RF07 | Atribuições motorista–veículo N:N dentro de frota; pelo menos um veículo ao salvar; confirmação; impedir registros sem atribuição | UC04 (parcial) |
| RF08 | Quantidade de viagens, distância, despesas e outros indicadores sem fórmula definida | UC05 |
| RF09 | Motorista consulta placa, modelo e status dos veículos atribuídos | UC06 (seleção, parcial) |
| RF10 | Início, acompanhamento e encerramento de viagens com origem, destino, data e situação | UC06 |
| RF11 | Registro e consulta de despesas, tipo, valor, data e descrição | UC07 |
| RF12 | Imagens de comprovantes/NF vinculadas a despesas | UC07 |
| RF13 | Quilometragem inicial/final e distância | UC06; RN08 também abrange UC07/UC08 |

UC08 define registro/consulta de manutenção por gestor e motorista, sem RF próprio. Abastecimento aparece em UC07 e no aceite TAP 1.14, sem RF exclusivo.

## Regras e requisitos de qualidade

RN01: perfil único. RN02: administração operacional exclusiva do gestor. RN03: motorista limitado a veículos atribuídos. RN04: placa única. RN05: no máximo uma frota por veículo. RN06: uma viagem ativa por motorista e por veículo. RN07: odômetro não decrescente e km final ≥ inicial. RN08: foto obrigatória em toda leitura de odômetro, inclusive início/fim, manutenção e abastecimento.

RNF01: operações principais ≤ 3 s em conexão normal, com exceção de imagens. RNF02: autenticação, autorização por perfil, senha protegida e comunicação segura. RNF03: interface simples/padronizada e mensagens claras. RNF04: disponibilidade com redundância ou recuperação; sem off-line. RNF05: MySQL persistente e imagens vinculadas em infraestrutura adequada. RNF06: React Native Android/iOS.

## Contradições e perguntas para decisão do usuário

| ID | Origem e divergência/lacuna | Resolução necessária antes da implementação afetada |
|---|---|---|
| P01 | RF04 deixa veículos sem frota após exclusão; RF05 exige frota obrigatória; RN05 limita a uma | Definir estado sem frota e operações permitidas |
| P02 | RF04/RF05/RF06 descrevem exclusões; UC02/UC03/UC04 mencionam vínculos impeditivos | Definir quais vínculos bloqueiam exclusão e destino de históricos, especialmente frota/veículo |
| P03 | Matriz oficial associa RF06 a UC03, RF08 a UC04 e RF10/RF13 a UC05, entre outras divergências; texto atual usa UC04, UC05 e UC06 respectivamente | Aprovar revisão da matriz, preservada nesta etapa |
| P04 | PI Justificativa/Objetivo geral menciona localização e comunicação; RF não especifica GPS, rastreamento ou mensagens | Confirmar alcance; não presumir tempo real nem chat |
| P05 | RF03 tem frase ambígua sobre campos somente leitura e senha; RF06 permite gestor editar dados de motorista | Confirmar CNH editável por gestor e limites de edição; nunca interpretar como exibição da senha armazenada |
| P06 | RF01 permite autocadastro de motorista; RF06 permite cadastro pelo gestor | Definir criação/convite, senha inicial, vinculação de contas existentes e tratamento de e-mail duplicado |
| P07 | Papéis fala em frotas sob responsabilidade do gestor; não define cardinalidade/propriedade ou isolamento | Definir acesso entre gestores e eventual separação por empresa |
| P08 | RF08 fala em métricas para usuário; UC05/Papéis direcionam ao gestor | Definir acesso de motorista, filtros, fórmulas, períodos e indicadores exatos |
| P09 | UC08 e RN08 exigem manutenção e foto; RF05 exige alertas | Definir campos/tipos de manutenção, periodicidade/limiares e apresentação dos alertas |
| P10 | RF12 permite anexo; UC07 diz quando necessário; RN08 exige foto do odômetro | Definir obrigatoriedade dos comprovantes por categoria, formatos, tamanhos, retenção e infraestrutura; foto do odômetro já é obrigatória |
| P11 | Internet intermitente assumida, mas off-line excluído | Definir mensagens, repetição e prevenção de duplicidade em falhas de envio sem ampliar escopo |
| P12 | RN06/RN07 requerem consistência concorrente; RF06 permite motorista inativo finalizar viagem | Definir estados/transições, autorização para finalizar após desativação e tratamento de atribuição removida em viagem |
| P13 | UC07 permite vínculo com veículo ou viagem; RF11 enfatiza durante viagem | Definir despesas/abastecimentos fora de viagem e eventual modelagem separada |
| P14 | RF03/RF06 preservam histórico sem identificação | Definir anonimização de fotos/documentos e vínculos pessoais; exclusão de gestor não tem efeito sobre frotas definido |
| P15 | RNF01 usa conexão normal; RNF04 não fixa disponibilidade numérica | Definir ambiente/carga de aceite, recuperação, backups e métricas operacionais |
| P16 | PI capa cita Projeto Integrador V e apresentação cita X; ER histórico menciona validação, PI descreve levantamento futuro | Confirmar revisão documental vigente e evidência de protótipo validado; não inferir precedência entre documentos |

## Critérios para validação futura (proposta derivada das fontes)

Validar fluxos positivos/negativos RF01–RF13 e UC01–UC08, permissões por perfil/atribuição, unicidade e concorrência RN04/RN06, odômetro/foto RN07/RN08, desativação e exclusão conforme regras resolvidas. Medir RNF01 em ambiente acordado, verificar segurança e persistência, testar app em Android/iOS e executar avaliação com cliente conforme PI. Nenhum desses critérios foi executado ou aceito nesta inicialização.
