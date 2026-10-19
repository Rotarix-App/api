# Contexto geral — Rotarix

Base documental consolidada em 18/10/2026. Não representa aceite de implementação.

## Fontes e leitura

- **TAP**: [Termo de abertura](documentação-original/TAP_Termo_Abertura_Rotarix.md), seções 1.5–1.14.
- **ER**: [Especificação de requisitos](documentação-original/Especificacao_Requisitos_Rotarix.md), RF01–RF13, RNF01–RNF06, RN01–RN08, UC01–UC08 e Papéis de Usuários.
- **PI**: [Projeto de intervenção](documentação-original/Projeto_Intervencao_Rotarix.md), Introdução, Objetivos, Referencial Teórico, Metodologia e Cronograma.
- [Análise de requisitos e lacunas](requesitos/ANALISE_DOCUMENTAL.md), [decisões](../historico/DECISOES.md) e [estado real do código](../historico/PROGRESSO.md).

## Problema, objetivo e limites

A Transcarvalho registra viagens e despesas de caminhões em papel, dificultando consultas históricas, apuração de custos e acompanhamento da operação. O Rotarix centraliza esses registros em aplicativo móvel simples para gestores e motoristas, reduzindo perdas, inconsistências e retrabalho (TAP 1.5–1.9; PI Introdução e Justificativa).

Inclui gestão de frotas, veículos e motoristas, atribuições, viagens, quilometragem, despesas, fotos de comprovantes e odômetro, abastecimentos, manutenções e métricas. Categorias de despesas: combustível, pedágio, alimentação, borracharia e manutenção de urgência. Painel administrativo web e funcionamento off-line estão fora da versão (TAP 1.10; ER Escopo). Localização aparece no PI, mas não tem contrato operacional definido nos RF.

## Usuários e permissões

Cada usuário possui somente um perfil, escolhido no cadastro e imutável: Gestor ou Motorista (RF01; RN01).
Ambos podem cadastrar-se, autenticar-se e gerenciar o próprio perfil (RF01–RF03).
O gestor gerencia frotas, veículos, motoristas e atribuições e acompanha históricos e métricas das frotas sob sua responsabilidade (RF04–RF08; Papéis de Usuários).
O motorista visualiza apenas veículos atribuídos e registra viagens, despesas e manutenções nesses veículos; consulta as próprias viagens (RF07, RF09–RF13; RN03; Papéis).
UC08 também permite manutenção pelo gestor. A delimitação de responsabilidade entre gestores/empresas ainda precisa ser definida.

## Arquitetura e tecnologias

Documentação oficial: aplicativo React Native para Android/iOS (RNF06), JavaScript, Expo, MySQL em servidor próprio, API com Swagger/OpenAPI, Figma, VS Code, Git e GitHub (PI Referencial Teórico e Metodologia). Dados estruturados no MySQL; imagens em infraestrutura apropriada, vinculadas aos registros (RNF05). Comunicação segura e senhas protegidas (RNF02); redundância ou recuperação de infraestrutura (RNF04; TAP 1.13).

Repositório inspecionado: API Node.js/CommonJS, Express 5, Sequelize 6/mysql2, Zod, Swagger, Socket.IO; dependências JWT/bcryptjs, Jest/Supertest e Docker Compose MySQL 8. São evidências técnicas do repositório, não novas decisões do usuário. O padrão local em `.github/prompts/architecture.prompt.md` orienta Routes → Middlewares → Controllers → Services → Repositories → Models. Camadas de domínio ainda vazias. Não há app móvel neste checkout. Hospedagem, armazenamento de imagens e uso funcional de sockets não estão consolidados.

## Entidades identificáveis (modelo conceitual, não esquema aprovado)

| Conceito | Dados e vínculos identificáveis | Origem |
|---|---|---|
| Usuário / perfis | Nome, e-mail único, senha, telefone; motorista tem número/categoria da CNH | RF01–RF03, RN01 |
| Frota | Nome, base, região, status; reúne veículos | RF04–RF05 |
| Veículo | Placa única, marca, modelo, ano, odômetro, status, frota | RF05, RN04–RN05 |
| Atribuição | Motorista ↔ veículo, muitos para muitos, selecionados dentro de frota | RF07 |
| Viagem | Motorista, veículo, origem/destino, início/fim, quilometragens, situação | RF10, RF13, UC06 |
| Despesa / abastecimento | Categoria, valor, data, descrição, vínculo operacional e comprovante | RF11–RF12, UC07 |
| Manutenção | Veículo, tipo e informações do registro; demais campos pendentes | UC08, RN08 |
| Imagem / leitura de odômetro | Foto de comprovante ou odômetro vinculada ao registro | RF12, RNF05, RN08 |

Não se confirmou se abastecimento exige entidade separada de despesa, nem se leitura/foto será tabela própria. Gestor responsável é conceito documental, mas sua cardinalidade com frotas não está definida. Empresa é contexto do negócio; segregação multiempresa não foi especificada.

## Regras essenciais

Somente gestor administra cadastros operacionais e atribuições (RN02). Motoristas só operam veículos atribuídos (RN03). Veículo pertence a no máximo uma frota (RN05), com conflito entre obrigatoriedade de vínculo em RF05 e veículo sem frota após exclusão em RF04.
Motorista e veículo têm, cada um, no máximo uma viagem em andamento (RN06). Leituras de odômetro nunca podem diminuir; quilometragem final não pode ser inferior à inicial (RN07). Toda leitura no início/fim da viagem, abastecimento e manutenção exige foto (RN08).
Frota inativa impede novas viagens e preserva vínculos/históricos; pode ser reativada (RF04). Veículo em viagem não pode ser desativado (RF05). Motorista pode ser desativado durante viagem, com alerta e preservação da viagem até finalizar (RF06). Exclusão de motorista preserva viagens/despesas sem identificação (RF03/RF06). Detalhes de exclusão e retenção dependem de resolução das lacunas.

## Qualidade, premissas, riscos e aceite

Consultas e cadastros principais em até 3 segundos sob conexão normal; imagens podem demorar mais (RNF01). Autenticação e permissões, comunicação segura, armazenamento seguro de senhas, mensagens claras, persistência e disponibilidade compõem RNF02–RNF06.
Premissas: smartphones com câmera, dados móveis e instrução básica; API e armazenamento disponíveis; internet intermitente em estradas (TAP 1.12; ER Premissas). Prazo TAP: 17/08/2026 a 25/11/2026; cerca de quatro meses. Recursos fornecidos pela equipe e ferramentas gratuitas/livres (PI Metodologia).
Riscos: adulteração de registros (mitigação documental: foto do odômetro), indisponibilidade (redundância/recuperação), prazo curto e perda de conectividade sem modo off-line. Estratégia concreta para falhas de envio ainda pendente.
Aceite TAP 1.14: app em diferentes sistemas móveis, gestão de frotas/veículos/motoristas e métricas; motorista visualiza veículos e registra viagens, manutenções, abastecimentos e NF. ER acrescenta validações, autorização, fotos e RNFs. PI prevê protótipo validado pelo gestor antes da codificação, iterações semanais e avaliação com versões utilizáveis comparando o processo anterior. Não há evidência de aceite ou de validação do protótipo neste repositório.
