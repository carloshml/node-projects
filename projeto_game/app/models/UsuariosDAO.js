let crypto = require('crypto');
let ObjectID = require('mongodb').ObjectID;

function UsuarioDAO(connection) {
    // underline converção para que a variável só funciona nessa função
    this._connection = connection;
}

UsuarioDAO.prototype.inserirUsuario = async function (usuario, application, res) {
    usuario.senha = crypto.createHash('md5').update(usuario.senha).digest('hex');

    console.log('usuario  ::: ', usuario);


    return await this._connection
        .getDB()
        .then(async db => {
            const existeUsuario = await db.db.collection("usuarios")
                .find({ usuario: usuario.usuario })
                .toArray()
                .then((result) => {
                    //req.query.resultados =  result;                              
                    //res.render('usuarios',req.query, ); 
                    console.log(' result 0001 ', result);
                    db.client.close();
                    if (result.length > 0) {
                        console.log('Usuario já existe 001!!');
                        return true;
                    } else {
                        return false;
                    }
                })
                .catch(error => {
                    console.log('  algum erro foi encontrado  ', error);
                });


            console.log('Usuario  result  existeUsuario ', existeUsuario);
            if (existeUsuario) {
                console.log('Usuario já existe 002 !!');
                return 'usuarioexiste';
            }

            delete usuario._id;

            return await this._connection
                .getDB()
                .then(async db2 => {
                    return await db2.db.collection("usuarios")
                        .insertOne(usuario)
                        .then((result) => {
                            // geração dos parametros
                            var connection = application.config.dbConection;
                            var JogoDAO = new application.app.models.JogoDAO(connection);
                            JogoDAO.gerarParametrosJogo(result.insertedId);
                            console.log('0003 ', result);
                            return 'sucesso';
                        })
                        .catch(error => {
                            console.log('  algum erro foi encontrado  ', error);
                        });
                })
                .catch(error => {
                    console.log('  algum erro foi encontrado  ', error);
                });
        })
}

UsuarioDAO.prototype.atualizarUsuario = async function (usuario, req, res) {
    req.query.jogo = JSON.parse(req.query.jogo);
    return await this._connection
        .getDB()
        .then(async db => {
            const result = await db.db
                .collection("usuarios")
                .updateOne({ "_id": ObjectID(usuario._id) },
                    { $set: { "nome": usuario.nome, "usuario": usuario.usuario } },
                    { upsert: true }
                    // { $inc: {moeda:moedas} },
                    // {} como é apenas uma conexao esse permanece falso
                );
            db.client.close();
            return true;
        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
        });
}




UsuarioDAO.prototype.buscaJogoUsuario = async function (res, req, casa, msg) {
    const usuarioId = req.session._id;
    const teste = await this._connection.getDB()
        .then(async db => {
            return await db.db
                .collection("jogo")
                .find({ usuario: ObjectID(usuarioId) })
                .toArray(async function (err, result) {
                    result[0].nome = req.session.nome;
                    const usuario2 = { img_casa: casa, jogo: result[0], msg: msg };
                    res.send(usuario2);
                    db.client.close();
                    return usuario2;
                });
        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
        });
}

UsuarioDAO.prototype.buscarUsuarioGerarAldeoes = function (res, req, casa, msg) {
    const usuarioId = req.session._id;
    this._connection.getDB()
        .then(db => {
            db.db.collection("jogo")
                .find({ usuario: ObjectID(usuarioId) })
                .toArray(function (err, result) {
                    result[0].nome = req.session.nome;
                    let usuario2 = { img_casa: casa, jogo: result[0], msg: msg };
                    res.render('aldeoes', usuario2);
                    db.client.close();
                });
        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
        });
}

UsuarioDAO.prototype.listarUsuarios = async function () {
    return await this._connection.getDB()
        .then(async db => {
            return await db.db.collection("usuarios")
                .find()
                .toArray()
                .then(result => {
                    db.client.close();
                    return result;
                })
        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
            return error;
        });
}

UsuarioDAO.prototype.autenticar = function (usuario, req, res) {
    usuario.senha = crypto.createHash('md5').update(usuario.senha).digest('hex');
    this._connection
        .getDB()
        .then(config => {
            config.db.collection('usuarios')
                .find(usuario)
                .toArray(function (err, result) {

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
                    config.client.close();
                });

        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
            const errors = [
                { msg: 'algum erro foi encontrado autenticar usuário' }
            ]
            res.render('index', { validacao: errors, aviso: {} });
        });


}

UsuarioDAO.prototype.irParaHome = function (res, usuario, casa, msg, req) {
    this._connection
        .getDB()
        .then(db => {
            db.db
                .collection("jogo")
                .find({ usuario: ObjectID(req.session._id) })
                .toArray(function (err, result) {
                    result[0].nome = req.session.nome;
                    result[0]._id = req.session._id;
                    res.render('home', { img_casa: casa, jogo: result[0], msg: msg });
                    db.client.close();
                });
        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
            const errors = [
                { msg: 'algum erro foi encontrado irParaHome' }
            ]
            res.render('index', { validacao: errors, aviso: {} });
        });
}


UsuarioDAO.prototype.buscarUsuarios = async function (res, req, casa, msg, jogos) {    
    req.query.jogo = JSON.parse(req.query.jogo);
    let usuarios = [];
    await this._connection.getDB()
        .then(async db => {
            let dbCollection = db.db.collection("usuarios");
            for await (const jogo of jogos) {
                let usuario = await dbCollection.findOne({ _id: ObjectID(jogo.idUsuario) });
                usuario.jogo = jogo;
                usuario.img_casa = usuario.casa;
                usuarios.push(usuario);
            }
            db.client.close();
            res.render('ranking', { img_casa: casa, nome: req.session.nome, usuarios });  
        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
        });
}

UsuarioDAO.prototype.verRanking = async function (res, req, casa, msg, application) {
    const teste = await this._connection.getDB()
        .then(async db => {
            let dbCollection = db.db.collection("jogo")
            let jogos = await dbCollection.find().sort({ moeda: -1 });
            var connection = application.config.dbConection;
            var UsuarioDAO = new application.app.models.UsuariosDAO(connection);
            UsuarioDAO.buscarUsuarios(res, req, casa, msg, jogos);
        })
        .catch(error => {
            console.log('  algum erro foi encontrado  ', error);
        });
}

module.exports = function () {
    return UsuarioDAO;
}