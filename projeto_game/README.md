# Game of Thrones RPG

<p align="center">
  <img src="app/public/images/game_of_thrones_logo.jpg" alt="Game of Thrones" width="420">
</p>

Jogo web de estratégia ambientado em **Game of Thrones**, feito com Node.js, Express, EJS e MongoDB. O jogador administra uma casa, distribui aldeões entre ordens, coleta recursos, vende no celeiro, treina habilidades e caça feras.

## Funcionalidades

- Cadastro e login de jogadores, com escolha de casa.
- Painel com moedas, aldeões, recursos e habilidades (temor, sabedoria, comércio e magia).
- HUD animado com ícones de moedas, aldeões, madeira, comida e ferro.
- Cards de ação com custo, duração e previsão de recompensa.
- Contadores animados e deltas flutuantes de ganho/perda.
- O modal de resultado só é exibido depois que a animação dos recursos termina.
- Ordens com tempo real: coleta, enforcamento, treinamento de história, treinamento de magia e caçada a feras.
- Barra de progresso, vida da fera, dano flutuante e efeitos de impacto na batalha.
- Recompensas ao concluir cada ordem, com modal central, loot reveal e contagem animada.
- Efeitos sonoros e ambiente opcionais via Web Audio, com botão de som.
- Celeiro para vender madeira, comida e ferro por moedas.
- Cinco feras com vida, recompensa e imagem próprias; a fera é sorteada pelo jogo.
- Ranking de jogadores por moedas.
- Tela de administração/CRUD de usuários.
- Visual temático com mapa, casas, ícones e cards de atividade.

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 20.19+ (testado com 24.x) |
| Servidor | Express 5 |
| Views | EJS 7 |
| Banco | MongoDB 7.0+ (driver `mongodb` 7.x) |
| Sessão | `express-session` (MemoryStore) |
| Validação | `express-validator` |
| Front-end | Bootstrap 5.3 local, CSS próprio e JavaScript puro (sem jQuery) |
| Autoload | `consign` |

## Requisitos

- Node.js 20.19 ou superior.
- npm.
- MongoDB local em `127.0.0.1:27017` (ou ajuste a conexão).
- Um navegador moderno (Chrome, Edge, Firefox ou Safari).

## Como rodar

```bash
git clone https://github.com/carloshml/node-projects.git
cd node-projects/projeto_game
npm install
```

Inicie o MongoDB. Se preferir Docker:

```bash
docker run -d --name mongo-got -p 27017:27017 mongo:7
```

O banco `got` é criado automaticamente no primeiro cadastro. Depois:

```bash
# desenvolvimento, com recarga automática
npm run dev

# ou execução simples
npm start
```

Abra <http://localhost:8200>.

> Execute os comandos dentro de `projeto_game`. Os caminhos de views e arquivos estáticos são relativos à raiz do projeto.

## Configuração

O projeto não usa arquivo `.env`; os valores estão no código:

| Configuração | Arquivo | Valor padrão |
|---|---|---|
| Porta HTTP | `app.js` | `8200` |
| Conexão MongoDB | `config/dbConection.js` | `mongodb://127.0.0.1:27017/got` |
| Banco | `config/dbConection.js` | `got` |
| Segredo da sessão | `config/server.js` | `secretkey-00045` |
| Views | `config/server.js` | `./app/views` |
| Arquivos estáticos | `config/server.js` | `./app/public` |

Para produção, mova esses valores para variáveis de ambiente e troque o segredo da sessão.

## Como jogar

1. Acesse `/cadastro`, escolha uma casa e crie sua conta.
2. Faça login em `/` e clique em **Jogar**.
3. No painel do jogo, use **Ordenar** para enviar aldeões a uma ordem.
4. Cada aldeão enviado fica ocupado até a ordem terminar; acompanhe o tempo e a barra de progresso em **Atividades**.
5. Ao concluir, o resultado aparece em um modal e os recursos/habilidades são creditados.
6. Venda madeira, comida e ferro no **Celeiro** para ganhar moedas.
7. Acompanhe sua posição no **Ranking**.
8. Abra **Pergaminhos** para consultar o histórico de ordens concluídas, recompensas e caçadas.
9. Contrate novos aldeões por **10.000 moedas** no botão abaixo de **Atividades**.

### Estado inicial

- 15 moedas.
- 10 aldeões.
- Recursos zerados.
- Habilidades (`temor`, `sabedoria`, `comércio`, `magia`) sorteadas entre 0 e 999.

## Regras do jogo

### Ordens

| Ação | Custo por aldeão | Duração por aldeão | Recompensa por aldeão |
|---|---:|---:|---|
| Coletar recursos | 2 moedas | 10 s | +5 madeira, +2 comida, +1 ferro |
| Enforcar aldeão | 3 moedas | 2 min | +5 temor |
| Ensinar história | 1 moeda | 3 min | +5 sabedoria |
| Ensinar magia | 1 moeda | 4 min | +5 magia |
| Matar a fera | 5 moedas | 30 s | depende da fera |

O custo é debitado e os aldeões são ocupados no momento da ordem. Ao terminar, a ordem é liquidada uma única vez e os aldeões são liberados.

### Feras

A fera é sorteada pelo servidor; o jogador **não escolhe** qual vai enfrentar. Cada aldeão contribui com **5 pontos de ataque**. A vitória acontece quando `aldeões × 5 >= vida da fera`.

| Fera | Vida | Mínimo de aldeões | Recompensa em moedas |
|---|---:|---:|---:|
| Lobo Gigante | 20 | 4 | 100 |
| Urso-Sombra | 30 | 6 | 160 |
| Serpente Marinha | 35 | 7 | 200 |
| Kraken | 40 | 8 | 240 |
| Dragão | 50 | 10 | 300 |

- **Vitória:** moedas da tabela + `ceil(vida / 3)` de temor.
- **Derrota:** nenhuma recompensa; os aldeões apenas retornam.
- A batalha não pode ser revogada depois de começar, para evitar sortear outra fera.

### Celeiro

| Recurso | Preço base |
|---|---:|
| Madeira | 1 moeda |
| Comida | 2 moedas |
| Ferro | 3 moedas |

O comércio valoriza a venda:

```text
preço efetivo = max(1, round(preço base × (1 + comércio / 1000)))
total recebido = quantidade × preço efetivo
```

Exemplo: com comércio 866, madeira vale 2, comida 4 e ferro 6 moedas por unidade.

### Revogação

Ordens comuns podem ser revogadas enquanto estão em andamento, com estorno do custo pago e liberação dos aldeões. Ordens de caça não podem ser revogadas.

## Estrutura do projeto

```text
projeto_game/
├── app.js                    # inicialização e porta 8200
├── config/
│   ├── dbConection.js        # conexão com o MongoDB
│   └── server.js             # Express, EJS, sessão e consign
├── app/
│   ├── controllers/          # regras de entrada das rotas
│   ├── models/               # JogoDAO, UsuariosDAO e definição das feras
│   ├── routes/               # rotas de jogo e de usuário
│   ├── views/                # templates EJS
│   └── public/
│       ├── css/              # estilo do jogo
│       ├── js/               # Bootstrap 5 bundle local
│       ├── jsView/           # lógica de tela e efeitos sonoros
│       └── images/           # mapa, casas, ícones e imagens das feras
├── package.json
└── README.md
```

O `consign` carrega automaticamente `app/routes`, `config/dbConection.js`, `app/models` e `app/controllers` em `config/server.js`.

## Rotas principais

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Tela de login |
| GET | `/cadastro` | Formulário de cadastro |
| POST | `/inserirUsuario` | Cria usuário e parâmetros iniciais do jogo |
| POST | `/autenticar` | Login e criação da sessão |
| GET | `/home` | Menu principal |
| GET | `/jogo` | Painel do jogo |
| GET | `/sair` | Encerra a sessão |
| GET | `/gerarSuditos` | Fragmento HTML do formulário de ordens |
| POST | `/gerarOrdemSuditos` | Cria uma ordem |
| GET | `/gerarPergaminhos` | Lista as ordens em andamento (JSON) |
| GET | `/historicoAcoes` | Histórico de ordens concluídas (JSON) |
| GET | `/atualizarAcoesDeJogo` | Liquida ordens concluídas (JSON) |
| GET | `/revogar_acao` | Revoga uma ordem e estorna o custo |
| GET | `/buscaJogoUsuario` | Dados atuais do jogo (JSON) |
| POST | `/venderRecurso` | Vende recurso no celeiro (JSON) |
| POST | `/comprarAldeao` | Contrata um aldeão por 10.000 moedas (JSON) |
| GET | `/buscarUsuarios` | Tela de usuários do sistema |
| GET | `/verRanking` | Ranking por moedas |
| POST | `/inserirUsuarioCrud` | Cadastro pela tela de administração |
| POST | `/atualizarUsuario` | Atualização de usuário pela administração |

## Modelo de dados

Banco `got`, coleções principais:

### `usuarios`

```json
{
  "nome": "Carlos",
  "usuario": "carlos",
  "senha": "hash-md5",
  "casa": "stark"
}
```

### `jogo`

```json
{
  "usuario": "carlos",
  "idUsuario": "ObjectId",
  "moeda": 15,
  "suditos": 10,
  "suditosTrabalhando": 0,
  "temor": 0,
  "sabedoria": 0,
  "comercio": 0,
  "magia": 0,
  "recursos": { "madeira": 0, "comida": 0, "ferro": 0 }
}
```

### `acao`

```json
{
  "usuario": "carlos",
  "acao": "5",
  "quantidade": 10,
  "custo": 50,
  "fera": "dragao",
  "acao_iniciada_em": 0,
  "acao_termina_em": 0,
  "duracao_ms": 300000,
  "terminado": false,
  "recompensado": false
}
```

## Scripts

| Comando | O que faz |
|---|---|
| `npm start` | Inicia o servidor com `node app.js` |
| `npm run dev` | Inicia com `nodemon app.js` |
| `npm test` | Placeholder; ainda não há suíte de testes automatizados |

## Limitações e próximos passos

- Senhas são armazenadas com **MD5**, o que não é seguro para produção. Migrar para bcrypt ou argon2.
- Sessões usam o `MemoryStore` padrão do `express-session`; reiniciar o servidor derruba os logins. Usar um store persistente.
- Conexão com o MongoDB e segredo da sessão estão no código; mover para variáveis de ambiente.
- Não há suíte de testes automatizados (`npm test` é apenas um placeholder).
- O layout usa Bootstrap 5 e não foi testado em navegadores antigos.
- A liquidação das ordens é feita por requisições do cliente (`/atualizarAcoesDeJogo`) e por uma verificação periódica; para produção, considerar um job no servidor.
- A administração de usuários não possui controle de perfil/role.

## Autor

**Carlos** — [@carloshml](https://github.com/carloshml)

## Licença

ISC.
