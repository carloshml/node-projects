let crypto = require('crypto');
let ObjectId = require('mongodb').ObjectId;

function UsuarioDAO(connection) {
    this._connection = connection;
}

UsuarioDAO.prototype.inserirUsuario = async function (usuario, application) {
    usuario.senha = crypto.createHash('md5').update(usuario.senha).digest('hex');
    const conexao = await this._connection.getDB();

    try {
        const existentes = await conexao.db.collection("usuarios")
            .find({ usuario: usuario.usuario })
            .toArray();

        if (existentes.length > 0) {
            return 'usuarioexiste';
        }

        delete usuario._id;
        const resultado = await conexao.db.collection("usuarios").insertOne(usuario);

        const JogoDAO = new application.app.models.JogoDAO(application.config.dbConection);
        await JogoDAO.gerarParametrosJogo(resultado.insertedId, usuario.usuario);

        return 'sucesso';
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
        return 'erro';
    } finally {
        await conexao.client.close();
    }
}

UsuarioDAO.prototype.atualizarUsuario = async function (usuario, req, res) {
    const conexao = await this._connection.getDB();

    try {
        await conexao.db.collection("usuarios").updateOne(
            { "_id": new ObjectId(usuario._id) },
            { $set: { "nome": usuario.nome, "usuario": usuario.usuario } },
            { upsert: true }
        );
        return true;
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
        return false;
    } finally {
        await conexao.client.close();
    }
}

UsuarioDAO.prototype.buscarUsuarioGerarAldeoes = async function (res, req, casa, msg) {
    const usuarioId = req.session._id;
    const conexao = await this._connection.getDB();

    try {
        const result = await conexao.db.collection("jogo")
            .find({ idUsuario: new ObjectId(usuarioId) })
            .toArray();

        if (!result || !result[0]) {
            res.redirect('/home');
            return;
        }

        result[0].nome = req.session.nome;
        res.render('aldeoes', {
            img_casa: casa,
            jogo: result[0],
            msg: msg,
            feras: require('./feras').FERAS
        });
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
    } finally {
        await conexao.client.close();
    }
}

UsuarioDAO.prototype.listarUsuarios = async function () {
    const conexao = await this._connection.getDB();

    try {
        return await conexao.db.collection("usuarios").find().toArray();
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
        return error;
    } finally {
        await conexao.client.close();
    }
}

UsuarioDAO.prototype.autenticar = async function (usuario, req, res) {
    usuario.senha = crypto.createHash('md5').update(usuario.senha).digest('hex');
    const conexao = await this._connection.getDB();

    try {
        const result = await conexao.db.collection('usuarios').find(usuario).toArray();

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
            res.redirect('/home');
        } else {
            const errors = [
                { msg: 'Usuario ou senha Incorreto' }
            ];
            res.render('index', { validacao: errors, aviso: {} });
        }
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
        const errors = [
            { msg: 'algum erro foi encontrado autenticar usuário' }
        ];
        res.render('index', { validacao: errors, aviso: {} });
    } finally {
        await conexao.client.close();
    }
}

UsuarioDAO.prototype.irParaHome = async function (res, usuario, casa, msg, req) {
    const conexao = await this._connection.getDB();

    try {
        const result = await conexao.db.collection("jogo")
            .find({ idUsuario: new ObjectId(req.session._id) })
            .toArray();

        if (!result || !result[0]) {
            res.redirect('/');
            return;
        }

        result[0].nome = req.session.nome;
        result[0]._id = req.session._id;
        res.render('home', { img_casa: casa, jogo: result[0], msg: msg });
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
        const errors = [
            { msg: 'algum erro foi encontrado irParaHome' }
        ];
        res.render('index', { validacao: errors, aviso: {} });
    } finally {
        await conexao.client.close();
    }
}

UsuarioDAO.prototype.buscarUsuarios = async function (res, req, casa, msg, jogos) {
    let usuarios = [];
    const conexao = await this._connection.getDB();

    try {
        const dbCollection = conexao.db.collection("usuarios");

        for (const jogo of jogos) {
            const usuario = await dbCollection.findOne({ "_id": new ObjectId(jogo.idUsuario) });
            if (!usuario) {
                continue;
            }
            usuario.jogo = jogo;
            usuario.img_casa = usuario.casa;
            usuarios.push(usuario);
        }

        res.render('ranking', { img_casa: casa, nome: req.session.nome, usuarios });
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
    } finally {
        await conexao.client.close();
    }
}

UsuarioDAO.prototype.verRanking = async function (res, req, casa, msg, application) {
    const conexao = await this._connection.getDB();
    let jogos = [];

    try {
        jogos = await conexao.db.collection("jogo").find().sort({ moeda: -1 }).toArray();
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
    } finally {
        await conexao.client.close();
    }

    const UsuarioDAO = new application.app.models.UsuariosDAO(application.config.dbConection);
    await UsuarioDAO.buscarUsuarios(res, req, casa, msg, jogos);
}

module.exports = function () {
    return UsuarioDAO;
}
