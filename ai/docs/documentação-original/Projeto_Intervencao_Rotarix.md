CENTRO UNIVERSITÁRIO DE PATOS DE MINAS

CURSO: SISTEMAS DE INFORMAÇÃO

DISCIPLINA: PROJETO INTEGRADOR V - EXTENSÃO CURRICULARIZADA

PROFESSORA: EDER MANOEL DE SANTANA

**ROTARIX**

> FERNANDA RAQUEL RODRIGUES ALVES
>
> GABRIEL ANDRADE SILVA
>
> HENRIQUE SILVA AMORIM
>
> JOÃO LUCAS FERNANDES
>
> LUCAS NUNES FONSECA COSTA
>
> LUÍS FELIPE SOUSA DE CARVALHO

PATOS DE MINAS

2026

FERNANDA RAQUEL RODRIGUES ALVES

GABRIEL ANDRADE SILVA

HENRIQUE SILVA AMORIM

JOÃO LUCAS FERNANDES

LUCAS NUNES FONSECA COSTA

LUÍS FELIPE SOUSA DE CARVALHO

**ROTARIX: seu companheiro na gestão de frotas**

> Projeto de Intervenção elaborado como requisito parcial de avaliação no Projeto Integrador X, do Curso de Sistemas de Informação, do Centro Universitário de Patos de Minas, sob orientação do (a) Professor (a) Eder Manoel de Santana.

PATOS DE MINAS

2026

**<span class="smallcaps">SUMÁRIO</span>**

[**1. INTRODUÇÃO 4**](#introdução)

> [1.1. Formulação do problema 4](#formulação-do-problema)
>
> [1.2. Justificativa 5](#justificativa)
>
> [1.3. Objetivos 5](#objetivos)
>
> [1.3.1. Objetivo geral 5](#objetivo-geral)
>
> [1.3.2. Objetivos específicos 6](#objetivos-específicos)

[**2. REFERENCIAL TEÓRICO 6**](#referencial-teórico)

> [2.1. Design e Prototipagem de Interfaces 6](#design-e-prototipagem-de-interfaces)
>
> [2.2. Linguagem de Programação Base 6](#linguagem-de-programação-base)
>
> [2.3. Framework de Desenvolvimento Móvel 7](#framework-de-desenvolvimento-móvel)
>
> [2.4. Ecossistema e Ferramental de Desenvolvimento 7](#ecossistema-e-ferramental-de-desenvolvimento)
>
> [2.5. Ambiente de Desenvolvimento Integrado 7](#ambiente-de-desenvolvimento-integrado)
>
> [2.6. Banco de Dados Relacional 7](#banco-de-dados-relacional)
>
> [2.7. Controle de Versão e Hospedagem do Código 7](#controle-de-versão-e-hospedagem-do-código)
>
> [2.8. Documentação e Teste de APIs 8](#documentação-e-teste-de-apis)

[**3. METODOLOGIA 8**](#metodologia)

[**4. CRONOGRAMA 9**](#cronograma)

[**REFERÊNCIAS 9**](#referências)

#  INTRODUÇÃO

Na atualidade, a implantação de sistemas informatizados tem se tornado cada vez mais necessária para empresas que ainda armazenam grandes volumes de dados em formato físico. Esse modelo de armazenamento pode comprometer a segurança e a integridade das informações, além de ocupar um espaço físico considerável e dificultar o acesso e a consulta a dados de períodos anteriores. Nesse contexto, a digitalização desses processos apresenta-se como uma alternativa para otimizar o armazenamento, facilitar a recuperação das informações e aumentar a eficiência das atividades realizadas pela empresa. Entretanto, fatores como os custos de desenvolvimento e implantação dos sistemas, bem como a necessidade de adaptação dos funcionários aos novos procedimentos, podem dificultar a implementação dessas soluções.

Essa realidade é particularmente evidente no setor de transporte rodoviário de cargas, responsável pela maior parte da movimentação de mercadorias no país. Nesse segmento, o controle da frota envolve o acompanhamento de veículos, motoristas, viagens e despesas operacionais, atividades que geram um volume expressivo de registros diários. Quando mantidos manualmente e fisicamente, esses registros tornam-se suscetíveis a perdas, inconsistências e retrabalho, além de dificultarem a apuração de custos por viagem e a tomada de decisão pela gestão.

A partir dessa problemática, ao analisar o processo de controle de frotas da empresa Transcarvalho, identificou-se a necessidade do desenvolvimento de um software de baixo custo para dispositivos móveis, capaz de centralizar, organizar e disponibilizar informações relacionadas à gestão da frota. Diante disso, a solução proposta tem como objetivo facilitar o acompanhamento dos veículos e motoristas, o registro e controle das viagens realizadas, bem como o gerenciamento dos gastos associados a cada viagem. Dessa forma, busca-se proporcionar maior agilidade e organização aos processos internos, facilitar o acesso às informações e contribuir para uma gestão mais eficiente da frota.

## Formulação do problema

Atualmente, a empresa Transcarvalho realiza de forma manual o registro de informações relacionadas às viagens e despesas de sua frota, utilizando documentos físicos. Esse processo dificulta a centralização, a organização e a consulta dos dados, principalmente quando há necessidade de acessar informações referentes a períodos maiores. Diante dessa situação, identifica-se a necessidade de uma solução que reúna essas informações em um único ambiente, tornando o registro e o acesso aos dados mais simples e organizados.

Nesse contexto, o desenvolvimento da aplicação mobile Rotarix busca centralizar o gerenciamento das informações da frota, permitindo o registro e a consulta de dados relacionados a viagens, despesas, veículos e motoristas, contribuindo para um acompanhamento mais eficiente das operações da empresa.

## Justificativa

A realização deste projeto justifica-se pela necessidade de melhorar a organização e o controle das informações relacionadas à gestão da frota da empresa Transcarvalho, considerando as dificuldades encontradas no acompanhamento de veículos, motoristas, viagens e despesas. O uso de registros físicos pode tornar o acesso às informações mais demorado, além de aumentar as possibilidades de perdas, inconsistências e retrabalho durante as atividades de controle.

Nesse contexto, torna-se relevante o desenvolvimento de uma ferramenta que centralize essas informações e facilite o acompanhamento das operações da frota. Do ponto de vista prático, o Rotarix propõe uma aplicação móvel voltada ao cadastro e consulta de veículos e motoristas, registro de viagens, acompanhamento de localização, controle de distâncias percorridas e gerenciamento de gastos, permitindo que essas informações sejam acessadas de maneira mais organizada e prática.

Além disso, a utilização de tecnologias como React Native e MySQL possibilita a construção de uma solução multiplataforma e economicamente viável, adequada às necessidades identificadas na empresa. Dessa forma, espera-se que a aplicação contribua para a redução do uso de registros físicos, facilite o acesso às informações e auxilie na tomada de decisões relacionadas à gestão da frota, ao mesmo tempo em que permite à equipe aplicar na prática conhecimentos adquiridos durante o curso de Sistemas de Informação.

## Objetivos

##  Objetivo geral

Desenvolver uma aplicação mobile denominada Rotarix, com o propósito de otimizar o gerenciamento e a organização de rotas de motoristas, proporcionando maior controle e acompanhamento das operações por parte do setor administrativo. A aplicação visa facilitar a comunicação entre administradores e motoristas, permitindo o monitoramento de localização, distâncias percorridas, gastos e demais informações relevantes, contribuindo para uma gestão mais eficiente, prática e integrada das atividades de transporte.

## Objetivos específicos

Analisar o processo atual de registro e controle das informações relacionadas às viagens e despesas da frota da empresa Transcarvalho, identificando suas principais dificuldades e necessidades;

Levantar referências bibliográficas relacionadas à gestão de frotas e à utilização de tecnologias da informação no gerenciamento de operações de transporte;

Identificar os requisitos necessários para atender às necessidades dos gestores e motoristas da empresa;

Projetar uma solução mobile que permite centralizar o cadastro e a consulta de informações referentes a veículos, motoristas, viagens, despesas e manutenções;

Desenvolver a aplicação Rotarix de acordo com os requisitos identificados;

Avaliar a aplicação desenvolvida, verificando sua capacidade de facilitar o registro, a organização e o acesso às informações relacionadas à gestão da frota.

# REFERENCIAL TEÓRICO

Neste capítulo, são detalhados os fundamentos teóricos essenciais para a compreensão do trabalho, juntamente com as tecnologias escolhidas para o desenvolvimento da aplicação.

## Design e Prototipagem de Interfaces 

O Figma é uma ferramenta colaborativa voltada para o design e a criação de protótipos (FIGMA, 2016). Ele permite que a equipe desenhe e valide todas as telas e fluxos de navegação do aplicativo antes de começar a escrever o código. Essa etapa de prototipagem ajuda a alinhar os requisitos com as necessidades do cliente, reduzindo retrabalho.

## 2.2. Linguagem de Programação Base 

O JavaScript é uma linguagem de programação dinâmica. Lançada em 1995 e padronizada pelo ECMAScript, ela foi criada originalmente para deixar as páginas da web interativas (MDN WEB DOCS, 1995). Com o tempo, seu uso se expandiu para servidores e aplicativos móveis, permitindo utilizar uma mesma linguagem em diferentes partes do sistema.

## 2.3. Framework de Desenvolvimento Móvel 

O React Native é um framework de código aberto criado pela Meta em 2015 para o desenvolvimento de aplicativos móveis (REACT NATIVE, 2015). Ele permite criar aplicativos para Android e iOS utilizando uma única base de código em JavaScript. Ao contrário de outras soluções híbridas, o React Native utiliza componentes nativos das plataformas. Isso garante desempenho e visual idênticos aos de aplicativos criados nativamente, além de economizar tempo e recursos.

## 2.4. Ecossistema e Ferramental de Desenvolvimento

O Expo é um conjunto de ferramentas gratuito e de código aberto construído sobre o React Native para facilitar a criação de aplicativos móveis (EXPO, 2018). Ele simplifica toda a configuração do ambiente de desenvolvimento. Com o aplicativo Expo Go, o desenvolvedor consegue rodar e testar o projeto em tempo real direto no seu próprio celular, sem a necessidade de instalar emuladores ou configurar programas no computador.

## 2.5. Ambiente de Desenvolvimento Integrado 

O Visual Studio Code é um ambiente de desenvolvimento integrado leve e muito utilizado por programadores (MICROSOFT, 2015). No projeto, ele é usado como o editor de texto principal para escrever, organizar e gerenciar todo o código-fonte da aplicação móvel.

## 2.6. Banco de Dados Relacional 

O MySQL é um dos Sistemas Gerenciadores de Banco de Dados Relacionais de código aberto (ORACLE, 1995). Ele organiza os dados em tabelas compostas por linhas e colunas através da linguagem SQL, garantindo a consistência das informações através de transações confiáveis (MYSQL, 1995). A utilização do MySQL em um servidor próprio permite que a empresa mantenha o controle total sobre a sua infraestrutura e seus dados, garantindo a sincronização das informações entre dispositivos.

## 2.7. Controle de Versão e Hospedagem do Código 

O Git é um sistema distribuído de controle de versão que registra todo o histórico de alterações do código-fonte (GIT, 2005). O GitHub funciona como uma plataforma na nuvem para armazenar e organizar os repositórios criados com o Git (GITHUB, 2008). A combinação dessas duas ferramentas facilita a colaboração na equipe, o controle das modificações e a segurança dos dados.

## 2.8. Documentação e Teste de APIs 

O Swagger é um conjunto de ferramentas baseadas na especificação OpenAPI voltado para a documentação, visualização e teste de APIs (SWAGGER, 2011). Ele permite gerar automaticamente uma interface gráfica interativa que expõe os endpoints do servidor. Com essa ferramenta, os desenvolvedores conseguem testar cada funcionalidade do backend de forma isolada e visualizar os dados que precisam ser enviados e recebidos. Na prática, a ferramenta cria uma fonte única que alinha as camadas da aplicação, tornando o desenvolvimento integrado mais transparente e seguro.

# 3. METODOLOGIA

O desenvolvimento deste projeto visa gerar um produto tecnológico adequado a dispositivos móveis destinado à solução do problema identificado no processo de registro e auditoria de informações sobre as frotas de veículos.

Inicialmente, será realizada a fase de levantamento dos requisitos necessários para o desenvolvimento do projeto. Esta etapa será conduzida na sede da empresa Transcarvalho, com a participação do gestor responsável pela frota e dos funcionários envolvidos no processo atual de registro. Ao final desta etapa, serão definidos os requisitos funcionais e não funcionais, bem como os componentes arquitetônicos e as tecnologias adequadas para a construção da aplicação.

Em um segundo momento, será iniciada a modelagem do sistema, contemplando a elaboração dos diagramas de casos de uso, além do modelo entidade-relacionamento responsável por estruturar o banco de dados que será o guia para os desenvolvedores. Paralelamente, será construído o protótipo da interface na ferramenta Figma, que deverá abordar todas as funcionalidades definidas no processo anterior e apresentar um fluxo de navegação simples e intuitivo. O protótipo será apresentado ao gestor da empresa para validação antes do início da codificação, evitando retrabalho nas etapas seguintes.

Em um terceiro momento, terá início o desenvolvimento do código referente às interfaces do aplicativo e às rotas de comunicação e persistência de dados. O desenvolvimento seguirá a estratégia iterativa e incremental, com iterações definidas em períodos semanais, esperando-se que ao final de cada ciclo seja entregue ao menos uma funcionalidade proposta para aquele período.

A codificação será realizada com a utilização do ambiente de desenvolvimento Visual Studio Code, utilizando o framework React Native para a construção da aplicação móvel, por permitir a criação de aplicativos multiplataforma com desempenho nativo a partir de uma única base de código, o que simplifica e reduz significativamente o tempo e o custo de desenvolvimento. Para o armazenamento das informações, será utilizado o banco de dados MySQL em servidor próprio (self-hosted), garantindo a sincronização dos dados entre dispositivos e a disponibilidade das informações mesmo fora do ambiente da empresa. O controle de versão do código-fonte será feito por meio do Git, com repositório hospedado no GitHub.

Por fim, concluído o desenvolvimento, serão disponibilizadas versões utilizáveis do aplicativo para que ocorra um período inicial de testes. As informações obtidas ao longo de todas as etapas serão então compiladas e analisadas, comparando-se o processo anterior, baseado em registros físicos, com o processo apoiado pelo software desenvolvido, e os resultados, as limitações identificadas e as sugestões para trabalhos futuros serão sistematizados no relato final do projeto.

Quanto aos materiais necessários, todos os recursos serão providos pela própria equipe de desenvolvimento, sem custos adicionais para a empresa. As ferramentas adotadas possuem versões gratuitas ou licenças de uso livre, o que atende diretamente à premissa de solução

economicamente viável estabelecida para o projeto.

# 

# 4. CRONOGRAMA

| **DESCRIÇÃO DAS ATIVIDADES**          | **Ago.** | **Set.** | **Out.** | **Nov.** | **Dez.** |
|---------------------------------------|----------|----------|----------|----------|----------|
| Conhecimento e discussão do tema      | X        |          |          |          |          |
| Delimitação do *locus* de intervenção | X        |          |          |          |          |
| Diagnóstico do(s) problema(s)         |          | X        |          |          |          |
| Planejamento da intervenção           |          | X        |          |          |          |
| Intervenção                           |          | X        | X        | X        |          |
| Análise dos resultados da intervenção |          |          |          | X        |          |
| Redação do trabalho final             |          |          |          | X        |          |

# 

# 

# 

# 

# 

# 

# REFERÊNCIAS

ALURA. O que é React Native? Vantagens e guia do framework. Disponível em: [<u>https://www.alura.com.br/artigos/react-native</u>](https://www.alura.com.br/artigos/react-native).

EXPO. Introduction to Expo. Disponível em: [<u>https://docs.expo.dev/</u>](https://docs.expo.dev/).

FIGMA. Figma: a ferramenta de design de interface colaborativa. Disponível em: [<u>https://www.figma.com/pt-br/?context=localeChange</u>](https://www.figma.com/pt-br/?context=localeChange).

GITHUB. Documentação de ajuda do GitHub.com. Disponível em: [<u>https://docs.github.com/pt</u>](https://docs.github.com/pt).

MYSQL. MySQL: MySQL Documentation. Disponível em: [<u>https://dev.mysql.com/doc/</u>](https://dev.mysql.com/doc/).

ORACLE. O que é o MySQL? Disponível em: [<u>https://www.oracle.com/br/mysql/what-is-mysql/</u>](https://www.oracle.com/br/mysql/what-is-mysql/).

REACT NATIVE. React Native: a framework for building native apps using React. Disponível em: [<u>https://reactnative.dev/</u>](https://reactnative.dev/).

SWAGGER. Swagger Documentation. Disponível em: [<u>https://swagger.io/docs/</u>](https://swagger.io/docs/).
