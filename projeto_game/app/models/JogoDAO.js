let ObjectID = require('mongodb').ObjectID;

function JogoDAO(connection) {
    this._connection = connection;
}

JogoDAO.prototype.gerarParametrosJogo = function (usuario) {
    this._connection.getDB()
        .then(db => {
            db.collection("jogo",
                function (erro, collection) {
                    collection.insert({
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
            db.collection("jogo",
                function (erro, collection) {
                    // collection.find({usuario:{$eq:usuario.usuario}, senha:{$eq: usuario.senha}});
                    //collection.find({usuario:usuario.usuario, senha: usuario.senha});
                    collection.find({ usuario: ObjectID(usuarioId) })
                        .toArray(function (err, result) {
                            result[0].nome = req.session.nome;
                            res.render('jogo', { img_casa: casa, jogo: result[0], msg: msg });
                        });

                });
        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
        });
}

JogoDAO.prototype.gerarOrdemSuditos = function (acao) {
    this._connection.getDB()
        .then(db => {
            db.collection("acao", function (erro, collection) {
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
                collection.insert(acao);
            });

            db.collection("jogo", function (erro, collection) {
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
                collection.update({ "_id": ObjectID(acao.jogo._id) },
                    // { $set:{moeda:moedas} },
                    { $set: { moeda: moedas, suditosTrabalhando: parseInt(acao.jogo.suditosTrabalhando) + parseInt(acao.quantidade) } },
                    // {} como é apenas uma conexao esse permanece falso
                );

            });
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
            db.collection("acao", function (erro, collectionAcao) {
                const momento_atual = new Date().getTime();
                collectionAcao
                    .find(
                        { usuario: usuario, acao_termina_em: { $gt: momento_atual } }
                    )
                    .toArray(function (err, acoesNaoTerminadasResp) {
                        acoesNaoTerminadas = acoesNaoTerminadasResp;
                        const jsonContent = JSON.stringify({ acoes: acoesNaoTerminadas });
                        res.setHeader("Content-Type", "application/json");
                        res.end(jsonContent);

                    });
            });
        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
        });
}

JogoDAO.prototype.atualizarAcoesDeJogo = function (req, res) {


    const jogoid = req.query.jogoid;
    const usuario = req.session.usuario;
    let totalSuditosAcoesTerminadas = 0;
   
    _connection = this._connection
    this._connection
        .getDB()
        .then(async db => {
            db.collection("acao", function (erro, collectionAcao) {
                const momento_atual = new Date().getTime();
                collectionAcao
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
                        
                        _connection.getDB()
                            .then(async db => {
                                db.collection("jogo", function (erro2, collectionJogo) {
                                    collectionJogo
                                        .find({ "_id": ObjectID(jogoid) })
                                        .toArray(function (err, jogo) {
                                            
                                            collectionJogo
                                                .update({ "_id": ObjectID(jogoid) },
                                                    { $set: { suditosTrabalhando: jogo[0].suditosTrabalhando - totalSuditosAcoesTerminadas } }
                                                );
                                          
                                            _connection.getDB()
                                                .then(async db => {
                                                    db.collection("acao", function (erro, collectionAcao) {
                                                        
                                                        const momento_atual = new Date().getTime();
                                                        collectionAcao
                                                            .updateMany(
                                                                {
                                                                    usuario: usuario,
                                                                    acao_termina_em: { $lte: momento_atual },
                                                                    terminado: false
                                                                },
                                                                { $set: { terminado: true } },
                                                            );
                                                      
                                                    });
                                                })
                                                .catch(error => {
                                                    console.log('  algum erro foi encontrado  ', error);
                                                });


                                        });
                                });

                            })
                            .catch(error => {
                                console.log('  algum erro foi encontrado  ', error);
                            });
                    });
            });
        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
        });



    const acoesNaoTerminadas = { tudoCerto: true };
    const jsonContent = JSON.stringify(acoesNaoTerminadas);
    res.setHeader("Content-Type", "application/json");
    res.end(jsonContent);
}

JogoDAO.prototype.revogarAcao = function (req, res) {

    const idAcao = req.query.id_acao;
    const jogoid = req.query.jogoid;

    let acaoParaDeletar = null;

    this._connection.getDB()
        .then(db => {
            db.collection("acao",
                function (erro, collection) {

                    collection
                        .find({ _id: ObjectID(idAcao) })
                        .toArray(function (err, acaoParaDeletarResp) {
                            acaoParaDeletar = acaoParaDeletarResp;
                        });

                    collection
                        .remove({ _id: ObjectID(idAcao) },
                            function (err, result) {
                                res.redirect('jogo?msg=Deleted');

                            }
                        );
                });

            db.collection("jogo", function (erro2, collectionJogo) {
                collectionJogo
                    .find({ "_id": ObjectID(jogoid) })
                    .toArray(function (err, jogo) {
                        collectionJogo
                            .update({ "_id": ObjectID(jogoid) },
                                { $set: { suditosTrabalhando: jogo[0].suditosTrabalhando - acaoParaDeletar[0].quantidade } }
                            );

                    });
            })
        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
        });
}

module.exports = function () {
    return JogoDAO;
}