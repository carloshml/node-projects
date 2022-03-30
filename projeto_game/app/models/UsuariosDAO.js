let crypto = require('crypto');
let ObjectID = require('mongodb').ObjectID;

function UsuarioDAO(connection) {
    // underline converção para que a variável só funciona nessa função
    this._connection = connection();
}

UsuarioDAO.prototype.inserirUsuario = function (usuario, application, res) {
    this._connection.open(function (err, mongoclient) {
        mongoclient.collection("usuarios",
            function (erro, collection) {
                usuario.senha = crypto.createHash('md5').update(usuario.senha).digest('hex');
                collection.find({ usuario: usuario.usuario })
                    .toArray(function (err, result) {
                        //req.query.resultados =  result;                              
                        //res.render('usuarios',req.query, ); 
                        if (result.length > 0) {
                            var erros = [
                                { msg: 'Usuario já existe!!' }
                            ];
                            usuario.senha = undefined;
                            res.render('cadastro',{ validacao: erros, dadosForm: usuario });
                            mongoclient.close();
                        } else {
                            collection.insert(usuario, function (err, result) {
                                if (err) throw err;
                                mongoclient.close();
                                // geração dos parametros
                                var connection = application.config.dbConection;
                                var JogoDAO = new application.app.models.JogoDAO(connection);
                                JogoDAO.gerarParametrosJogo(result.ops[0]._id);
                                var avisos = [
                                    { msg: 'Você Foi Cadastrado com Sucesso!!' }
                                ]
                                res.render('index', { validacao: {}, aviso: avisos });
                            });
                        }
                    });

            });
    });
}

UsuarioDAO.prototype.updateUsuario = function (usuario, req, res) {
    req.query.jogo = JSON.parse(req.query.jogo);
    this._connection.open(function (err, mongoclient) {
        mongoclient.collection("usuarios", function (erro, collection) {
            collection.update({ "_id": ObjectID(usuario._id) },
                { $set: { "nome": usuario.nome, "usuario": usuario.usuario } },
                { upsert: true }
                // { $inc: {moeda:moedas} },
                // {} como é apenas uma conexao esse permanece falso
            );
            collection.find({ _id: ObjectID(usuario._id) })
                .toArray(function (err, result) {
                    //req.query.resultados =  result;                              
                    //res.render('usuarios',req.query, );    
                    res.redirect('buscarUsuarios?' + usuario.id_jogo);
                    mongoclient.close();
                });
        });
    });
}


UsuarioDAO.prototype.irParaHome = function (res, usuario, casa, msg, req) {
    this._connection.open(function (err, mongoclient) {
        mongoclient.collection("jogo",
            function (erro, collection) {
                // collection.find({usuario:{$eq:usuario.usuario}, senha:{$eq: usuario.senha}});
                //collection.find({usuario:usuario.usuario, senha: usuario.senha});
                collection.find({ usuario: ObjectID(req.session._id) })
                    .toArray(function (err, result) {
                        result[0].nome = req.session.nome;
                        result[0]._id = req.session._id;
                        res.render('home', { img_casa: casa, jogo: result[0], msg: msg });
                        mongoclient.close();
                    });

            });
    });
}

UsuarioDAO.prototype.buscaJogoUsuario = function (res, req, casa, msg) {
    const usuarioId = req.session._id;
    let usuario2;
    this._connection.open(function (err, mongoclient) {
        mongoclient.collection("jogo", function (erro, collection) {
            // collection.find({usuario:{$eq:usuario.usuario}, senha:{$eq: usuario.senha}});
            //collection.find({usuario:usuario.usuario, senha: usuario.senha});
            collection.find({ usuario: ObjectID(usuarioId) })
                .toArray(function (err, result) {                    
                    result[0].nome = req.session.nome;
                    usuario2 = { img_casa: casa, jogo: result[0], msg: msg };
                    res.send(usuario2);
                });
            mongoclient.close();
        });
    });
}

UsuarioDAO.prototype.buscarUsuarioGerarAldeoes = function (res, req, casa, msg) {
    const usuarioId = req.session._id;
    let usuario2;
    this._connection.open(function (err, mongoclient) {
        mongoclient.collection("jogo", function (erro, collection) {
            // collection.find({usuario:{$eq:usuario.usuario}, senha:{$eq: usuario.senha}});
            //collection.find({usuario:usuario.usuario, senha: usuario.senha});
            collection.find({ usuario: ObjectID(usuarioId) })
                .toArray(function (err, result) {                     
                    result[0].nome = req.session.nome;
                    usuario2 = { img_casa: casa, jogo: result[0], msg: msg };
                    res.render('aldeoes', usuario2);
                });
            mongoclient.close();
        });
    });
}

UsuarioDAO.prototype.buscarUsuarios = function (res, req, casa, msg) {
    const usuario = req.session.usuario;
    req.query.jogo = JSON.parse(req.query.jogo);
    this._connection.open(function (err, mongoclient) {
        mongoclient.collection("usuarios",
            function (erro, collection) {
                collection.find().toArray(function (err, result) {
                    req.query.resultados = result;
                    const opcoes = req.query;
                    res.render('usuariosSistema', opcoes,);
                    mongoclient.close();
                });
            });
    });
}

UsuarioDAO.prototype.autenticar = function (usuario, req, res) {
    this._connection.open(function (err, mongoclient) {
        mongoclient.collection("usuarios",
            function (erro, collection) {
                // collection.find({usuario:{$eq:usuario.usuario}, senha:{$eq: usuario.senha}});
                //collection.find({usuario:usuario.usuario, senha: usuario.senha});
                usuario.senha = crypto.createHash('md5').update(usuario.senha).digest('hex');
                collection.find(usuario).toArray(function (err, result) {
                    if (result[0] != undefined) {
                        req.session.autorizado = true;
                        req.session.usuario = result[0].usuario;
                        req.session.casa = result[0].casa;
                        req.session.nome = result[0].nome;
                        req.session._id = result[0]._id;
                    } else {
                        req.session.autorizado = false;
                    }

                    if (req.session.autorizado) {
                        res.redirect('home');
                    } else {
                        var errors = [
                            { msg: 'Usuario ou senha Incorreto' }
                        ]
                        res.render('index', { validacao: errors, aviso: {} });
                    }
                });
                mongoclient.close();
            });
    });
}

module.exports = function () {
    return UsuarioDAO;
}