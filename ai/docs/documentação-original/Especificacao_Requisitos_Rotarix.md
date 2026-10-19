**Documento de Especificação de Requisitos de Software**

**Sumário**

[**INTRODUÇÃO** 3](#introdução)

[**DEFINIÇÃO DOS REQUISITOS DE USUÁRIO** 4](#definição-dos-requisitos-de-usuário)

> [**Requisitos Funcionais** 4](#requisitos-funcionais)
>
> [**Requisitos Não Funcionais** 4](#requisitos-não-funcionais)
>
> [**Regras do Negócio** 5](#regras-do-negócio)
>
> [**Papéis de Usuários** 5](#papéis-de-usuários)
>
> [**Técnica de levantamento utilizada** 5](#técnica-de-levantamento-utilizada)

# **INTRODUÇÃO**

Este documento apresenta a especificação de requisitos para a informatização do aplicativo para dispositivos móveis Rotarix. O Rotarix é uma aplicação destinada a dispositivos móveis com acesso à internet, cujo principal objetivo é fornecer módulos para o gerenciamento e controle de frotas de veículos.

O aplicativo permitirá a criação e gestão de frotas, cadastros de veículos e motoristas, registro de viagens e gastos, bem como a consulta e o acompanhamento de tais informações. A solução terá foco em proporcionar maior praticidade e eficiência possível no processo atual da empresa, por meio de uma interface minimalista, intuitiva e de fácil utilização, promovendo um fluxo de navegação fluido e intuitivo.

Este documento descreve os requisitos funcionais, os requisitos não funcionais e as regras de negócio do sistema, servindo como base para o desenvolvimento, implementação e validação da aplicação.

## **Escopo do Sistema**

O escopo do Rotarix contempla as seguintes funcionalidades e atividades:

- Desenvolvimento de um aplicativo mobile destinado aos motoristas e gestores;

- Criação e gerenciamento de frotas, veículos e motoristas;

- Registro de viagens, incluindo informações como início, término, quilometragem, origem e destino;

- Registro de despesas realizadas durante as viagens;

- Inclusão de fotos dos comprovantes das despesas;

- Classificação das despesas nas seguintes categorias: combustível, pedágio, alimentação, borracharia e manutenção de urgência.

Também foram identificadas funcionalidades desejáveis para o sistema, porém que não fazem parte do escopo desta versão do projeto:

- Desenvolvimento de um painel administrativo para acesso via Web;

- Implementação de funcionamento do aplicativo em modo off-line.

## **Premissas e Restrições**

Como premissas assume-se que os motoristas possuem smartphones, câmera e plano de dados ativo, que possuem instrução básica para uso do app, que haverá infraestrutura em nuvem/API disponível para sincronização de dados e armazenamento das imagens dos comprovantes e que o sinal de internet será intermitente nas estradas.

A maior e única restrição que temos é o prazo para entregar o projeto completo, já que em quatro meses temos que idealizar o projeto desde o protótipo até a última entrega, e fazer reuniões para decidir como será a repartição de responsabilidades do aplicativo. Fazendo com que assim temos um tempo muito limitado, porém ainda possível.

# **DEFINIÇÃO DOS REQUISITOS DE USUÁRIO**

## **Requisitos Funcionais**

**RF01**: Cadastro de usuário: O sistema deve oferecer o cadastro de novos usuários, que podem se registrar como Gestor ou Motorista.

Perfil Gestor ou Motorista, nome completo, e-mail, senha, telefone, número da CNH só para o Motorista, categoria da CNH só para o Motorista.

O sistema deve permitir escolher o perfil Gestor ou Motorista e preencher as informações correspondentes para concluir o cadastro. Caso o cadastro seja realizado com sucesso, o usuário deve ser direcionado à tela inicial do seu perfil. Caso alguma informação obrigatória esteja ausente ou incorreta, o sistema deve informar o usuário sobre o erro de preenchimento.

- O sistema deve validar se nome completo, e-mail, senha e telefone estão preenchidos.

- Para o perfil Motorista, número e categoria da CNH também devem estar preenchidos.

- O e-mail informado deve ser único no sistema; caso já exista conta cadastrada com o mesmo e-mail, o sistema deve informar o erro ao usuário.

- O perfil escolhido no cadastro não pode ser alterado após a conclusão do cadastro.

- Caso alguma das informações acima não cumpra essas regras, o sistema deve informar o usuário a respeito do erro de preenchimento.

**RF02:** Autenticação de usuário: O sistema deve permitir que usuários previamente cadastrados realizem autenticação utilizando o e-mail e senha.

- O sistema deve validar as credenciais informadas

- Em caso de erro, deve exibir mensagem apropriada

- Em caso de sucesso, o usuário deve ser direcionado para a área principal do sistema

**RF03:** Gerenciamento de Perfil: O sistema deve oferecer o gerenciamento do perfil do usuário.Nome completo, e-mail, telefone, senha atual, nova senha para Motorista, número e categoria da CNH são exibidos apenas para visualização .

O sistema deve permitir que o usuário visualize seus dados cadastrais, edite nome, e-mail e telefone, altere sua senha, saia da sessão ou exclua da conta. Caso a exclusão seja solicitada, o sistema deve exigir confirmação do usuário antes de confirmar a ação.

- O sistema deve validar se nome, e-mail e telefone estão preenchidos ao salvar a edição do perfil.

- Para alterar a senha, o usuário deve informar a senha atual e confirmar a nova senha.

- Ao sair da conta, o sistema deve exigir novo login no próximo acesso.

- No caso do perfil Motorista, a exclusão remove os dados pessoais e a CNH; viagens e despesas já registradas permanecem no histórico da frota sem identificação.

**RF04:** Gerenciamento de frotas: O sistema deve oferecer o cadastro e a gestão de frotas.

O sistema deve permitir que o gestor crie, edite, desative ou exclua frotas. Caso a frota seja criada com sucesso, o sistema deve orientar o gestor a cadastrar veículos e atribuir motoristas a ela em seguida. Caso a frota seja desativada, ela deixa de ficar disponível para o registro de novas viagens, mas veículos, motoristas e históricos vinculados permanecem cadastrados, podendo a frota ser reativada. Caso a frota seja excluída, a ação não pode ser desfeita.

- O sistema deve validar se o nome da frota e a base e região estão preenchidos.

- O sistema deve permitir buscar frotas por nome e filtrar por status.

- Para excluir uma frota, o sistema deve exigir que o gestor digite o nome da frota como confirmação.

- Ao excluir uma frota, os veículos vinculados ficam sem frota e as atribuições de motoristas relacionadas a ela são removidas.

**RF05:** Gerenciamento de veículos: O sistema deve oferecer o cadastro e a gestão de veículos vinculados a uma frota. Informação do veículo, marca, modelo, ano, odômetro atual, frota.

O sistema deve permitir que o gestor cadastre, edite, desative ou exclua veículos, sendo que cada veículo deve pertencer obrigatoriamente a uma única frota. Caso o veículo esteja em viagem no momento, o sistema não deve permitir sua desativação até que a viagem seja finalizada. Caso a exclusão seja confirmada, o veículo é removido e deixa de ser exibido para os motoristas.

- O sistema deve validar se placa, marca, modelo, ano e frota estão preenchidos.

- A placa deve ser única no sistema; caso já esteja cadastrada em outro veículo, o sistema deve informar o erro ao gestor.

- O sistema deve gerar alertas de revisão com base na quilometragem do odômetro.

- Para excluir um veículo, o sistema deve exigir que o gestor digite a placa como confirmação.

- Caso o gestor tente desativar um veículo em viagem, o sistema deve informar que a ação não é possível até a viagem ser concluída.

**RF06:** Gerenciamento de motoristas: O sistema deve oferecer o cadastro e a gestão de motoristas.Nome completo, e-mail, telefone, número da CNH, categoria da CNH.

O sistema deve permitir que o gestor cadastre, edite, desative ou exclua os dados de motoristas. Caso um motorista seja desativado enquanto possui uma viagem em andamento, o sistema deve alertar o gestor, mas permitir a desativação, mantendo a viagem ativa até sua finalização. Caso os dados do motorista sejam excluídos, a ação não pode ser desfeita.

- O sistema deve validar se nome, e-mail, telefone, número e categoria da CNH estão preenchidos.

- O sistema deve permitir buscar motoristas por nome ou CNH e filtrar por status.

- Para excluir os dados de um motorista, o sistema deve exigir uma confirmação.

- Ao excluir os dados de um motorista, nome, contato e CNH são removidos, mas viagens e despesas já registradas permanecem no histórico da frota sem identificação.

**RF07:** Associação de motoristas a frotas/veículos:O sistema deve oferecer a atribuição de motoristas aos veículos de uma frota.

O sistema deve permitir que o gestor selecione uma frota e, dentre os veículos pertencentes a ela, marque quais serão atribuídos a um motorista. As atribuições só devem ser efetivadas mediante confirmação do gestor. Um motorista somente pode visualizar e registrar viagens, despesas e manutenções nos veículos para os quais possui atribuição.

- O sistema deve permitir que um veículo tenha mais de um motorista atribuído.

- O sistema deve permitir que um motorista tenha mais de um veículo atribuído.

- Caso o gestor tente salvar sem selecionar nenhum veículo, o sistema deve informar que ao menos um veículo deve ser selecionado.

- O sistema deve impedir que um motorista registre viagens, despesas ou manutenções em veículos não atribuídos a ele.

**RF08:** Visualização de métricas: O sistema deve permitir ao usuário visualizar métricas relacionadas à operação de frota, tais quais como quantidade de viagens feitas, distância percorrida do início ao fim do percurso, despesas/gastos registrados e demais indicadores relevantes.

**RF09:** Visualização de veículos atribuídos: O sistema deve permitir ao motorista visualizar o veículo atribuído a ele, mostrando a tal, as informações básicas do veículo, como placa, modelo e status atual.

**RF10:** Gerenciamento de viagens: O sistema deve permitir o registro e acompanhamento das viagens atuais, possibilitando informações de dados como origem, destino, data, situação temporária e informações durante o percurso.

**RF11:** Gerenciamento de despesas: O sistema deve permitir que o motorista registre e consulte despesas realizadas durante a viagem, informando qual o tipo de despesa, sejam eles: valor,data,descrição,etc.

**RF12:** Anexar comprovantes: O sistema deve permitir o anexo de comprovantes via NF às despesas registradas, possibilitando o armazenamento de imagem relativa aos gastos feitos.

**RF13:** Registro de quilometragem: O sistema deve permitir o registro de quilometragem inicial e final de uma viagem, podendo visualizar a distância percorrida durante o percurso.

## **Casos de Uso**

### UC01 – Gerenciar Usuário

**Ator(es):** Usuário  
**Pré-condição:** Usuário não cadastrado para criação de conta ou usuário já cadastrado para acesso às funcionalidades de sua conta.  
**Fluxo principal:**

1.  Acessar a tela de cadastro ou login.

2.  Informar os dados solicitados.

3.  Confirmar o cadastro ou autenticação.

4.  O sistema valida os dados.

5.  O sistema cria a conta ou autentica o usuário.

6.  O usuário pode visualizar e editar seus dados pessoais.

**Fluxos alternativos:**

- Dados obrigatórios não informados.

- E-mail já cadastrado.

- Credenciais inválidas.

- Dados informados inválidos.

**Pós-condição:**O cadastro ou os dados do usuário ficam registrados e atualizados no sistema, permitindo que ele acesse sua conta.

### UC02 – Gerenciar Frota

**Ator(es):** Gestor  
**Pré-condição:** Gestor autenticado.  
**Fluxo principal:**

1.  Acessar a área de frotas.

2.  Cadastrar uma nova frota ou selecionar uma frota existente.

3.  Informar ou alterar os dados da frota.

4.  Confirmar a operação.

5.  O sistema valida e registra as informações.

6.  O gestor pode consultar os dados da frota.

**Fluxos alternativos:**

- Campos obrigatórios não preenchidos.

- Dados inválidos ou duplicados.

- Frota possui vínculos que impedem sua exclusão.

**Pós-condição:**A frota fica registrada no sistema com os dados informados, podendo ser consultada e gerenciada pelo gestor.

### UC03 – Gerenciar Veículos

**Ator(es):** Gestor  
**Pré-condição:** Gestor autenticado e frota disponível para associação, quando necessário.  
**Fluxo principal:**

1.  Acessar a área de veículos.

2.  Cadastrar um novo veículo ou selecionar um veículo existente.

3.  Informar ou alterar os dados do veículo.

4.  Associar o veículo a uma frota.

5.  Confirmar a operação.

6.  O sistema valida e registra as informações.

**Fluxos alternativos:**

- Campos obrigatórios não preenchidos.

- Placa ou veículo já cadastrado.

- Veículo possui vínculos que impedem sua exclusão.

**Pós-condição:**O veículo fica registrado e vinculado à frota correspondente, ficando disponível para utilização e acompanhamento.

### UC04 – Gerenciar Motoristas

**Ator(es):** Gestor  
**Pré-condição:** Gestor autenticado.  
**Fluxo principal:**

1.  Acessar a área de motoristas.

2.  Cadastrar um novo motorista ou selecionar um motorista existente.

3.  Informar ou alterar os dados do motorista.

4.  Associar o motorista a uma frota ou veículo.

5.  Confirmar a operação.

6.  O sistema valida e registra as informações.

**Fluxos alternativos:**

- Campos obrigatórios não preenchidos.

- Motorista já cadastrado.

- Associação já existente ou conflitante.

- Motorista possui vínculos que impedem sua exclusão.

**Pós-condição:**Os dados do motorista ficam registrados no sistema e, quando necessário, ele fica vinculado à frota ou ao veículo correspondente.

### UC05 – Visualizar Informações da Frota

**Ator(es):** Gestor  
**Pré-condição:** Gestor autenticado e existência de dados da frota.  
**Fluxo principal:**

1.  Acessar a tela inicial ou área de informações da frota.

2.  O sistema consulta os dados disponíveis.

3.  O sistema processa as informações.

4.  O sistema apresenta métricas e informações da frota.

5.  O gestor pode consultar veículos, viagens, gastos e demais informações disponíveis.

**Fluxos alternativos:**

- Não existem dados para apresentar.

- Falha na consulta das informações.

**Pós-condição:**As informações e métricas da frota são apresentadas ao gestor, permitindo que ele acompanhe a situação da operação.

### UC06 – Gerenciar Viagens

**Ator(es):** Motorista  
**Pré-condição:** Motorista autenticado, veículo atribuído e, para finalizar, a existência de uma viagem em andamento.  
**Fluxo principal:**

1.  Selecionar um veículo atribuído.

2.  Informar ou confirmar os dados da viagem.

3.  Registrar o início da viagem.

4.  O sistema registra data, hora e quilometragem inicial.

5.  Durante a viagem, o motorista pode registrar informações relacionadas à operação.

6.  Ao finalizar, informar a quilometragem final.

7.  Confirmar o encerramento da viagem.

8.  O sistema registra o término e disponibiliza a viagem no histórico.

**Fluxos alternativos:**

- Veículo não atribuído ao motorista.

- Viagem já está em andamento.

- Quilometragem inválida ou inferior à inicial.

- Dados obrigatórios não informados.

**Pós-condição:**A viagem fica registrada no sistema com suas informações de início, término e quilometragem, podendo ser consultada posteriormente.

### UC07 – Registrar Despesas e Abastecimentos

**Ator(es):** Motorista  
**Pré-condição:** Motorista autenticado e veículo/viagem disponível.  
**Fluxo principal:**

1.  Acessar a opção de despesas ou abastecimento.

2.  Selecionar o tipo de registro.

3.  Informar os dados da despesa ou abastecimento.

4.  Selecionar a categoria da despesa, quando aplicável.

5.  Anexar o comprovante ou nota fiscal, quando necessário.

6.  Confirmar o registro.

7.  O sistema valida e armazena as informações.

**Fluxos alternativos:**

- Categoria não informada.

- Dados ou valores inválidos.

- Comprovante inválido ou falha no envio.

**Pós-condição:**A despesa ou o abastecimento fica registrado no sistema e vinculado ao veículo ou à viagem correspondente, juntamente com o comprovante quando houver.

### UC08 – Gerenciar Manutenções

**Ator(es):** Gestor e Motorista  
**Pré-condição:** Usuário autenticado e veículo cadastrado.  
**Fluxo principal:**

1.  Acessar o veículo.

2.  Selecionar a opção de manutenção.

3.  Informar os dados da manutenção.

4.  Selecionar o tipo de manutenção.

5.  Confirmar o registro.

6.  O sistema valida e armazena as informações.

7.  O usuário pode consultar os registros de manutenção.

**Fluxos alternativos:**

- Campos obrigatórios não preenchidos.

- Dados inválidos.

- Falha no registro da manutenção.

**Pós-condição:**A manutenção fica registrada no histórico do veículo, permitindo que suas informações sejam consultadas posteriormente.

## **Requisitos Não Funcionais**

**RNF01: Desempenho:** O sistema deve responder às principais operações de consulta e cadastro em até 3 segundos, considerando condições normais de conexão com a internet. Operações que envolvam o envio de imagens poderão possuir tempo de resposta superior, dependendo da velocidade da conexão do dispositivo.

**RNF02: Segurança:** O sistema deve garantir que as funcionalidades sejam acessadas apenas por usuários autenticados e respeitar as permissões definidas para os perfis Gestor e Motorista. As senhas dos usuários devem ser armazenadas de forma segura, utilizando mecanismo de criptografia ou hash, e a comunicação entre o aplicativo e o servidor deve utilizar conexão segura.

**RNF03: Usabilidade:** O aplicativo deve possuir interface simples, intuitiva e padronizada, permitindo que gestores e motoristas realizem as principais operações com facilidade. O sistema deve apresentar mensagens claras de confirmação, erro ou validação sempre que uma operação não puder ser concluída.

**RNF04: Disponibilidade:** O sistema deverá manter os serviços de back-end disponíveis enquanto houver conexão com a internet. A infraestrutura do servidor deverá possuir mecanismos de redundância ou recuperação para reduzir o impacto de possíveis falhas. O funcionamento off-line não será contemplado nesta versão do aplicativo.

**RNF05: Armazenamento de Dados:** Os dados estruturados da aplicação deverão ser armazenados de forma persistente em banco de dados MySQL. Imagens de comprovantes e fotografias do odômetro deverão ser armazenadas em infraestrutura apropriada, mantendo vínculo com seus respectivos registros no sistema e possibilitando sua posterior consulta.

**RNF06: Portabilidade:** O aplicativo deverá ser desenvolvido utilizando React Native, permitindo sua execução em dispositivos móveis com sistemas Android e iOS a partir de uma única base de código.

## **Regras do Negócio**

**RN01:** Todo usuário obrigatoriamente ocupará um único perfil, sendo: gestor ou motorista.

**RN02:** Somente usuários com perfil gestor podem criar, editar e desativar frotas e veículos, cadastrar motoristas e associar motoristas a frotas ou veículos.

**RN03:** Um motorista só pode visualizar os veículos atribuídos a ele e só pode registrar viagens, despesas e manutenções nesses veículos.

**RN04:** A placa de um veículo é única no sistema. Não podem existir dois veículos cadastrados com a mesma placa.

**RN05:** Cada veículo pode pertencer a somente uma única frota.

**RN06:** Um veículo pode ter no máximo uma viagem em andamento por vez. Um motorista também só pode ter uma viagem em andamento por vez.

**RN07**: A quilometragem final de uma viagem não pode ser menor que a quilometragem inicial. Nenhuma leitura de odômetro registrada pode ser menor que a última leitura já registrada para o mesmo veículo.

**RN08**: Todo registro de quilometragem (início e fim de viagem, abastecimento e manutenção) deve ser acompanhado de uma foto do odômetro.

## **Matriz de Rastreabilidade**

| **Requisito Funcional** | **Regra(s) de Negócio relacionada(s)** | **Caso de Uso relacionado** |
|-------------------------|----------------------------------------|-----------------------------|
| *RF01*                  | *RN01*                                 | *-*                         |
| *RF02*                  | *RN01*                                 | *UC01*                      |
| *RF03*                  | *RN01*                                 | *-*                         |
| *RF04*                  | *RN02*                                 | *UC02*                      |
| *RF05*                  | *RN02, RN04, RN05*                     | *-*                         |
| *RF06*                  | *RN02*                                 | *UC03*                      |
| *RF07*                  | *RN02, RN03*                           | *-*                         |
| *RF08*                  | *-*                                    | *UC04*                      |
| *RF09*                  | *RN03*                                 | *-*                         |
| *RF10*                  | *RN03, RN06, RN07, RN08*               | *UC05*                      |
| *RF11*                  | *RN03*                                 | *UC06, UC07*                |
| *RF12*                  | *-*                                    | *UC06, UC07*                |
| *RF13*                  | *RN07, RN08*                           | *UC05, UC06, UC07*          |

## **Papéis de Usuários**

<table>
<colgroup>
<col style="width: 24%" />
<col style="width: 75%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Referência</strong></th>
<th><em>Gestor</em></th>
</tr>
<tr class="odd">
<th><strong>Atributos</strong></th>
<th><em>Nome, e-mail (login), senha, telefone</em></th>
</tr>
<tr class="header">
<th><strong>Eventos</strong></th>
<th><ul>
<li><p><em>Criar e organizar as frotas da empresa;</em></p></li>
<li><p><em>Cadastrar veículos e motoristas;</em></p></li>
<li><p><em>Atribuir motoristas às frotas e aos veículos;</em></p></li>
<li><p><em>Acompanhar as viagens, despesas e manutenções registradas pelos motoristas;</em></p></li>
<li><p><em>Consultar métricas da frota por período.</em></p></li>
</ul></th>
</tr>
<tr class="odd">
<th><strong>Serviços</strong></th>
<th><ul>
<li><p><em>Cadastro, alteração e desativação de frotas (RF04);</em></p></li>
<li><p><em>Cadastro, alteração e desativação de veículos (RF05);</em></p></li>
<li><p><em>Cadastro, alteração e desativação de motoristas (RF06);</em></p></li>
<li><p><em>Associação de motoristas a frotas e veículos (RF07);</em></p></li>
<li><p><em>Visualização de métricas das frotas sob sua responsabilidade (RF08).</em></p></li>
</ul></th>
</tr>
<tr class="header">
<th><strong>Subpontos de vista</strong></th>
<th><em>Usuário do Sistema</em></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 24%" />
<col style="width: 75%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Referência</strong></th>
<th><em>Motorista</em></th>
</tr>
<tr class="odd">
<th><strong>Atributos</strong></th>
<th><em>Nome, e-mail (login), senha, telefone, número e categoria da CNH</em></th>
</tr>
<tr class="header">
<th><strong>Eventos</strong></th>
<th><ul>
<li><p><em>Iniciar e finalizar viagens com os veículos atribuídos a ele;</em></p></li>
<li><p><em>Registrar despesas durante as viagens (combustível, pedágio, alimentação, borracharia e manutenção de urgência);</em></p></li>
<li><p><em>Registrar abastecimentos e manutenções;</em></p></li>
<li><p><em>Fotografar comprovantes e o odômetro do veículo.</em></p></li>
</ul></th>
</tr>
<tr class="odd">
<th><strong>Serviços</strong></th>
<th><ul>
<li><p><em>Visualização dos veículos atribuídos (RF09);</em></p></li>
<li><p><em>Registro e consulta das próprias viagens (RF10);</em></p></li>
<li><p><em>Registro e consulta de despesas (RF11);</em></p></li>
<li><p><em>Envio de fotos de comprovantes (RF12);</em></p></li>
<li><p><em>Registro de quilometragem com foto do odômetro (RF13).</em></p></li>
</ul></th>
</tr>
<tr class="header">
<th><strong>Subpontos de vista</strong></th>
<th><em>Usuário do Sistema</em></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

<table>
<colgroup>
<col style="width: 24%" />
<col style="width: 75%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Referência</strong></th>
<th><em>Usuário do Sistema</em></th>
</tr>
<tr class="odd">
<th><strong>Atributos</strong></th>
<th><em>Nome, e-mail (login), senha, perfil (Gestor ou Motorista)</em></th>
</tr>
<tr class="header">
<th><strong>Eventos</strong></th>
<th><ul>
<li><p><em>Criar uma conta e acessar o aplicativo;</em></p></li>
<li><p><em>Manter os próprios dados de perfil atualizados.</em></p></li>
</ul></th>
</tr>
<tr class="odd">
<th><strong>Serviços</strong></th>
<th><ul>
<li><p><em>Cadastro de usuário (RF01);</em></p></li>
<li><p><em>Autenticação de usuário (RF02);</em></p></li>
<li><p><em>Gerenciamento do próprio perfil (RF03).</em></p></li>
</ul></th>
</tr>
<tr class="header">
<th><strong>Subpontos de vista</strong></th>
<th><em>Gestor, Motorista</em></th>
</tr>
</thead>
<tbody>
</tbody>
</table>

## **Técnica de levantamento utilizada**

Para levantar os requisitos necessários para o desenvolvimento do sistema, foram utilizadas algumas técnicas que ajudaram a entender melhor as necessidades e expectativas do projeto. Inicialmente, foram realizadas discussões em grupo (brainstorming), nas quais os integrantes da equipe puderam compartilhar ideias, sugestões e possíveis funcionalidades para o sistema. Esse momento de troca de informações contribuiu para reunir diferentes pontos de vista e estabelecer uma visão inicial sobre o que seria desenvolvido.

Também foi feita uma análise de sistemas semelhantes, buscando conhecer soluções já existentes, identificar funcionalidades importantes e observar boas práticas que poderiam ser aplicadas ao novo sistema. Essa etapa ajudou a equipe a compreender melhor as necessidades dos usuários e a definir requisitos mais adequados para o projeto.

Por fim, os requisitos levantados foram apresentados e validados junto ao cliente, permitindo verificar se as funcionalidades propostas estavam de acordo com suas necessidades e com os objetivos do projeto. Essa validação foi importante para garantir que os requisitos definidos fossem claros, relevantes e compatíveis com o escopo do sistema.

# **GLOSSÁRIO**

| **Termo**                                | **Definição**                                                                                                                             |
|------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| *Aplicativo Mobile*                      | *Aplicação desenvolvida para ser utilizada em dispositivos móveis, como smartphones e tablets.*                                           |
| *API*                                    | *Interface que permite a comunicação entre diferentes sistemas ou aplicações, possibilitando o envio e o recebimento de dados.*           |
| *Nuvem (cloud)*                          | *Ambiente de servidores acessível pela internet utilizado para armazenar dados, imagens e disponibilizar serviços de uma aplicação.*      |
| *Modo off-line*                          | *Forma de funcionamento em que o aplicativo pode ser utilizado sem conexão com a internet, pelo menos para determinadas funcionalidades.* |
| *Autenticação*                           | *O confirmar que o usuário faz login com e-mail e senha certo.*                                                                           |
| *Odômetro*                               | *O marcador do painel do veículo que registra quantos quilômetros ele já rodou no total.*                                                 |
| *CNH (Carteira Nacional de Habilitação)* | *Carteira Nacional de Habilitação, a carteira de motorista que dá permissão para dirigir.*                                                |
| *Credenciais*                            | *Os dados de identificação de alguém para entrar no aplicativo.*                                                                          |
| *Status*                                 | *Indica se algo pode ser usado no momento ou não, como um interruptor de ligado (ativo) e desligado (inativo)*                            |
| *Alerta de Revisão*                      | *Um aviso na tela avisando que o carro atingiu a quilometragem de ir para a oficina.*                                                     |

# **HISTÓRICO DE REVISÕES**

<table>
<colgroup>
<col style="width: 13%" />
<col style="width: 17%" />
<col style="width: 26%" />
<col style="width: 43%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Versão</strong></th>
<th><strong>Data</strong></th>
<th><strong>Autor</strong></th>
<th><strong>Descrição da alteração</strong></th>
</tr>
<tr class="odd">
<th><em>1.0</em></th>
<th><em>21/09/2026</em></th>
<th><em>Todos os integrantes</em></th>
<th><em>Versão inicial do documento</em></th>
</tr>
<tr class="header">
<th><em>1.1</em></th>
<th><em>24/09/2026</em></th>
<th><em>Lucas Nunes</em></th>
<th><em>Regras de Negócio, Matriz de Rastreabilidade e Papéis de Usuários</em></th>
</tr>
<tr class="odd">
<th><em>1.2</em></th>
<th><em>26/09/2026</em></th>
<th><em>João Lucas</em></th>
<th><h2 id="requisitos-funcionais-1-a-7-e-glossário"><em>Requisitos Funcionais 1 a 7 e Glossário</em></h2></th>
</tr>
<tr class="header">
<th><em>1.3</em></th>
<th><em>28/09/2026</em></th>
<th><em>Luis Felipe Sousa</em></th>
<th><h2 id="revisão-e-atualização-dos-casos-de-uso-principais-do-sistema"><em>Revisão e atualização dos casos de uso principais do sistema</em> </h2></th>
</tr>
<tr class="odd">
<th><em>1.4</em></th>
<th><em>28/09/2026</em></th>
<th><em>Fernanda Raquel</em></th>
<th><h2 id="revisão-da-formatação-de-todo-o-documento-e-descrito-a-técnica-o-levantamento"><em>Revisão da formatação de todo o documento e descrito a técnica o levantamento</em> </h2></th>
</tr>
</thead>
<tbody>
</tbody>
</table>
