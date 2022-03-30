let ObjectID = require('mongodb').ObjectID;

function JogoDAO(connection) {
    this._connection = connection();
}

JogoDAO.prototype.gerarParametrosJogo = function (usuario) {
    this._connection.open(function (err, mongoclient) {
        mongoclient.collection("jogo",
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
                mongoclient.close();
            });
    });
}

JogoDAO.prototype.iniciaJogo = function (res, req, casa, msg) {
    const usuarioId = req.session._id;
    this._connection.open(function (err, mongoclient) {
        mongoclient.collection("jogo",
            function (erro, collection) {
                // collection.find({usuario:{$eq:usuario.usuario}, senha:{$eq: usuario.senha}});
                //collection.find({usuario:usuario.usuario, senha: usuario.senha});
                collection.find({ usuario: ObjectID(usuarioId) })
                    .toArray(function (err, result) {
                        result[0].nome = req.session.nome;
                        res.render('jogo', { img_casa: casa, jogo: result[0], msg: msg });
                    });
                mongoclient.close();
            });
    });
}

JogoDAO.prototype.gerarOrdemSuditos = function (acao) {  
    this._connection.open(function (err, mongoclient) {
        mongoclient.collection("acao", function (erro, collection) {
            let tempoParaTermino = new Date().getTime();
            switch (parseInt(acao.acao)) {
                case 1: tempoParaTermino = tempoParaTermino + (1 * acao.quantidade * 60000);
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
            collection.insert(acao);
        });
        mongoclient.collection("jogo", function (erro, collection) {
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
            mongoclient.close();
        });
    });
}

JogoDAO.prototype.gerarPergaminhos = function (req, res) {


    const jogoid = req.query.jogoid;
    const usuario=  req.session.usuario;

    this._connection.open(function (err, mongoclient) {
        mongoclient.collection("acao", function (erro, collection) {
            const momento_atual = new Date().getTime();
            collection.find({ usuario: usuario, acao_termina_em: { $gt: momento_atual } })
                .toArray(function (err, result) {                   
                    if (result.length === 0) {
                        mongoclient.collection("jogo", function (erro, collection) {
                            collection.update({ "_id": ObjectID(jogoid) },                                
                                { $set: { suditosTrabalhando: 0 } }                                
                            );
                            mongoclient.close();
                        });
                    } else {
                        mongoclient.close();
                    }
                    res.render('pergaminhos', { acoes: result });
                });
        });
    });
}

JogoDAO.prototype.revogarAcao = function (idAcao, res) {
    this._connection.open(function (err, mongoclient) {
        mongoclient.collection("acao",
            function (erro, collection) {
                collection
                    .remove({ _id: ObjectID(idAcao) },
                        function (err, result) {
                            res.redirect('jogo?msg=Deleted');
                            mongoclient.close();
                        }
                    );
            });
    });
}
module.exports = function () {
    return JogoDAO;
}