let ObjectID = require('mongodb').ObjectID;
function JogoDAO(connection) {
    this._connection = connection;
}

JogoDAO.prototype.gerarParametrosJogo = function (usuario) {
    this._connection.getDB()
        .then(db => {
            db.db.collection("jogo")
                .insertOne({
                    usuario: usuario,
                    idUsuario: usuario,
                    moeda: 15,
                    suditos: 10,
                    suditosTrabalhando: 0,
                    temor: Math.floor(Math.random() * 1000),
                    sabedoria: Math.floor(Math.random() * 1000),
                    comercio: Math.floor(Math.random() * 1000),
                    magia: Math.floor(Math.random() * 1000),
                });
        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
        });
}

JogoDAO.prototype.iniciaJogo = function (res, req, casa, msg) {
    const usuarioId = req.session._id;
    this._connection.getDB()
        .then(db => {
            db.db.collection("jogo")
                .find({ usuario: ObjectID(usuarioId) })
                .toArray(function (err, result) {
                    result[0].nome = req.session.nome;
                    res.render('jogo', { img_casa: casa, jogo: result[0], msg: msg });
                    db.client.close();
                });
        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
        });
}

JogoDAO.prototype.gerarOrdemSuditos = async function (acao) {
    await this._connection.getDB()
        .then(async db => {
            let tempoParaTermino = new Date().getTime();
            switch (parseInt(acao.acao)) {
                case 1: tempoParaTermino = tempoParaTermino + (1 * acao.quantidade * 10000);
                    break;
                case 2: tempoParaTermino = tempoParaTermino + (2 * acao.quantidade * 60000);
                    break;
                case 3: tempoParaTermino = tempoParaTermino + (3 * acao.quantidade * 60000);
                    break;
                case 4: tempoParaTermino = tempoParaTermino + (4 * acao.quantidade * 60000);
                    break;
                default: console.log("error");
                    break;
            }
            acao.acao_termina_em = tempoParaTermino;
            acao.terminado = false;
            acao.quantidade = parseInt(acao.quantidade);
            await db.db.collection("acao").insertOne(acao);


            //  ATUALIZANDO O jogo 
            let moedas = null;
            switch (parseInt(acao.acao)) {
                case 1: moedas = acao.jogo.moeda - (2 * acao.quantidade);
                    break;
                case 2: moedas = acao.jogo.moeda - (3 * acao.quantidade);
                    break;
                case 3: moedas = acao.jogo.moeda - (1 * acao.quantidade);
                    break;
                case 4: moedas = acao.jogo.moeda - (1 * acao.quantidade);
                    break;
                default: console.log("error");
                    break;
            }

            await db.db.collection("jogo")
                .updateOne({ "_id": ObjectID(acao.jogo._id) },
                    // { $set:{moeda:moedas} },
                    { $set: { moeda: moedas, suditosTrabalhando: parseInt(acao.jogo.suditosTrabalhando) + parseInt(acao.quantidade) } },
                    // {} como é apenas uma conexao esse permanece falso
                );
            db.client.close();
        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
        });
}

JogoDAO.prototype.gerarPergaminhos = function (req, res) {
    const usuario = req.session.usuario;
    let acoesNaoTerminadas;
    this._connection.getDB()
        .then(db => {
            const momento_atual = new Date().getTime();
            db.db.collection("acao")
                .find(
                    { usuario: usuario, acao_termina_em: { $gt: momento_atual } }
                )
                .toArray(function (err, acoesNaoTerminadasResp) {
                    acoesNaoTerminadas = acoesNaoTerminadasResp;
                    const jsonContent = JSON.stringify({ acoes: acoesNaoTerminadas });
                    res.setHeader("Content-Type", "application/json");
                    res.end(jsonContent);
                    db.client.close();
                });
        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
            res.end(error);
        });
}

JogoDAO.prototype.atualizarAcoesDeJogo = async function (req, res, connection) {

    const jogoid = req.query.jogoid;
    const usuario = req.session.usuario;
    let totalSuditosAcoesTerminadas = 0;
    const momento_atual = new Date().getTime();
    await this._connection
        .getDB()
        .then(async db => {

            await db.db.collection("acao")
                .find(
                    {
                        usuario: usuario,
                        acao_termina_em: { $lte: momento_atual },
                        terminado: false
                    }
                )
                .toArray(function (err, acoesTerminadas) {
                    totalSuditosAcoesTerminadas = 0;
                    acoesTerminadas.forEach(acoesDeJogo => {
                        totalSuditosAcoesTerminadas = totalSuditosAcoesTerminadas + parseInt(acoesDeJogo.quantidade);
                    });

                    db.client.close();
                });

        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
        });

    await this._connection
        .getDB()
        .then(async db => {
            teste = await db.db
                .collection("jogo")
                .find({ "_id": ObjectID(jogoid) })
                .toArray(async function (err, jogo) {

                    await db.db.collection("jogo")
                        .updateOne({ "_id": ObjectID(jogoid) },
                            { $set: { suditosTrabalhando: jogo[0].suditosTrabalhando - totalSuditosAcoesTerminadas } }
                        );
                    db.client.close();
                });
        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
        });

    await this._connection
        .getDB()
        .then(async db => {

            await db.db.collection("acao")
                .updateMany(
                    {
                        usuario: usuario,
                        acao_termina_em: { $lte: momento_atual },
                        terminado: false
                    },
                    { $set: { terminado: true } },
                );
            db.client.close();
            const acerto = { tudoCerto: true };
            const jsonContent = JSON.stringify(acerto);
            res.setHeader("Content-Type", "application/json");
            res.status(200).end(jsonContent);
        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
            const jsonContent = JSON.stringify(error);
            res.setHeader("Content-Type", "application/json");
            res.status(500).end(jsonContent);
        });
}

JogoDAO.prototype.revogarAcao = async function (req, res) {

    const idAcao = req.query.id_acao;
    const jogoid = req.query.jogoid;

    let acaoParaDeletar = null;
    await this._connection
        .getDB()
        .then(async db => {
            await db.db.collection("acao")
                .find({ _id: ObjectID(idAcao) })
                .toArray(function (err, acaoParaDeletarResp) {
                    acaoParaDeletar = acaoParaDeletarResp;
                    db.client.close();
                });

        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
        });

    await this._connection
        .getDB()
        .then(async db => {

            await db.db.collection("jogo")
                .find({ "_id": ObjectID(jogoid) })
                .toArray(async function (err, jogo) {

                    await db.db
                        .collection("jogo")
                        .updateOne({ "_id": ObjectID(jogoid) },
                            { $set: { suditosTrabalhando: jogo[0].suditosTrabalhando - acaoParaDeletar[0].quantidade } }
                        );
                    db.client.close();
                });

        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
        });

    await this._connection
        .getDB()
        .then(async db => {
            await db.db.collection("acao")
                .deleteOne({ _id: ObjectID(idAcao) },
                    function (err, result) {
                        res.redirect('jogo?msg=Deleted');
                        db.client.close();
                    }
                );

        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
        });
}

module.exports = function () {
    return JogoDAO;
}