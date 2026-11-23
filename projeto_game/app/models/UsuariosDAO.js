let ObjectId = require('mongodb').ObjectId;
const { hashSenha, verificarSenha, gerarSenhaTemporaria } = require('../security/senha');
const { papelDoUsuario, ehAdmin } = require('../security/autorizacao');

function UsuarioDAO(connection) {
    this._connection = connection;
}

UsuarioDAO.prototype.inserirUsuario = async function (usuario, application) {
    const conexao = await this._connection.getDB();

    try {
        const existentes = await conexao.db.collection("usuarios")
            .find({ usuario: usuario.usuario })
            .toArray();

        if (existentes.length > 0) {
            return 'usuarioexiste';
        }

        usuario.senha = await hashSenha(usuario.senha);
        usuario.papel = 'jogador';
        usuario.precisaTrocarSenha = false;
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
        const id = new ObjectId(usuario._id);
        const contaAtual = await conexao.db.collection("usuarios").findOne({ "_id": id });
        const papelNovo = usuario.papel === 'admin' ? 'admin' : 'jogador';

        await conexao.db.collection("usuarios").updateOne(
            { "_id": id },
            {
                $set: {
                    "nome": usuario.nome,
                    "usuario": usuario.usuario,
                    "papel": papelNovo
                }
            },
            { upsert: true }
        );

        /* papel ou login alterados exigem nova autenticação */
        if (contaAtual && (contaAtual.papel !== papelNovo || contaAtual.usuario !== usuario.usuario)) {
            await invalidarSessoesDoUsuario(conexao.db, contaAtual.usuario);
        }

        return true;
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
        return false;
    } finally {
        await conexao.client.close();
    }
}

UsuarioDAO.prototype.resetarSenha = async function (idUsuario) {
    const conexao = await this._connection.getDB();

    try {
        if (!ObjectId.isValid(idUsuario)) {
            return { ok: false, msg: 'usuarioInvalido' };
        }

        const id = new ObjectId(idUsuario);
        const conta = await conexao.db.collection('usuarios').findOne({ _id: id });

        if (!conta) {
            return { ok: false, msg: 'usuarioNaoEncontrado' };
        }

        const senhaTemporaria = gerarSenhaTemporaria();
        const hash = await hashSenha(senhaTemporaria);

        await conexao.db.collection('usuarios').updateOne(
            { _id: id },
            {
                $set: {
                    senha: hash,
                    precisaTrocarSenha: true,
                    senhaResetadaEm: new Date()
                }
            }
        );

        await invalidarSessoesDoUsuario(conexao.db, conta.usuario);

        return {
            ok: true,
            senhaTemporaria: senhaTemporaria,
            usuario: conta.usuario,
            nome: conta.nome
        };
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
        return { ok: false, msg: 'erroResetarSenha' };
    } finally {
        await conexao.client.close();
    }
}

UsuarioDAO.prototype.trocarSenha = async function (idUsuario, novaSenha) {
    const conexao = await this._connection.getDB();

    try {
        if (!ObjectId.isValid(idUsuario)) {
            return false;
        }

        const hash = await hashSenha(novaSenha);
        const resultado = await conexao.db.collection('usuarios').updateOne(
            {
                _id: new ObjectId(idUsuario),
                precisaTrocarSenha: true
            },
            {
                $set: {
                    senha: hash,
                    precisaTrocarSenha: false,
                    senhaTrocadaEm: new Date()
                },
                $unset: {
                    senhaResetadaEm: ''
                }
            }
        );

        return resultado.modifiedCount === 1;
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
        return false;
    } finally {
        await conexao.client.close();
    }
}

async function invalidarSessoesDoUsuario(db, usuario) {
    const sessoes = await db.collection('sessoes')
        .find({}, { projection: { session: 1 } })
        .toArray();

    const ids = [];
    for (const doc of sessoes) {
        try {
            const dados = JSON.parse(doc.session);
            if (dados && dados.usuario === usuario) {
                ids.push(doc._id);
            }
        } catch (erro) {
            /* sessão inválida é ignorada; o TTL remove depois */
        }
    }

    if (ids.length > 0) {
        await db.collection('sessoes').deleteMany({ _id: { $in: ids } });
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
        result[0].campeao = Number(result[0].campeao) || 0;
        result[0].campeaoAtaque = result[0].campeao * 10;
        result[0].campeaoBonusMoeda = Math.floor(result[0].campeao / 3) * 0.1;
        res.render('aldeoes', {
            img_casa: casa,
            jogo: result[0],
            msg: msg,
            ultimaAcao: req.session.ultimaAcao || null,
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
    const usuarioInformado = typeof usuario.usuario === 'string' ? usuario.usuario.trim() : '';
    const senhaInformada = typeof usuario.senha === 'string' ? usuario.senha : '';
    const conexao = await this._connection.getDB();

    try {
        const conta = await conexao.db.collection('usuarios').findOne({
            usuario: usuarioInformado
        });

        let verificacao = { valida: false, precisaRehash: false };
        if (conta) {
            verificacao = await verificarSenha(senhaInformada, conta.senha);
        }

        if (!conta || !verificacao.valida) {
            req.session.autorizado = false;
            req.session.precisaTrocarSenha = false;
            const errors = [
                { msg: 'Usuário ou senha incorretos' }
            ];
            res.render('index', { validacao: errors, aviso: {} });
            return;
        }

        /* atualiza contas antigas em MD5 para o hash forte no próximo login */
        if (verificacao.precisaRehash) {
            try {
                const novoSenha = await hashSenha(senhaInformada);
                await conexao.db.collection('usuarios').updateOne(
                    { _id: conta._id },
                    { $set: { senha: novoSenha } }
                );
            } catch (erro) {
                console.log('  não foi possível atualizar o hash da senha  ', erro);
            }
        }

        req.session.autorizado = true;
        req.session.usuario = conta.usuario;
        req.session.casa = conta.casa;
        req.session.nome = conta.nome;
        req.session._id = conta._id;
        req.session.papel = papelDoUsuario(conta);
        req.session.precisaTrocarSenha = conta.precisaTrocarSenha === true;

        res.redirect(req.session.precisaTrocarSenha ? '/trocarSenha' : '/home');
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

        const jogos = await conexao.db.collection("jogo")
            .find({}, { projection: { moeda: 1, idUsuario: 1, usuario: 1 } })
            .sort({ moeda: -1 })
            .toArray();

        const indice = jogos.findIndex(function (jogo) {
            return String(jogo.idUsuario) === String(req.session._id);
        });

        let liderNome = null;
        if (jogos[0]) {
            const lider = await conexao.db.collection("usuarios")
                .findOne({ _id: new ObjectId(jogos[0].idUsuario) });
            liderNome = (lider && lider.nome) || jogos[0].usuario || null;
        }

        const ranking = {
            posicao: indice + 1,
            total: jogos.length,
            liderNome: liderNome,
            liderMoeda: jogos[0] ? Number(jogos[0].moeda) || 0 : 0
        };

        res.render('home', {
            img_casa: casa,
            jogo: result[0],
            msg: msg,
            ranking: ranking,
            admin: ehAdmin(req)
        });
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

        res.render('ranking', {
            img_casa: casa,
            nome: req.session.nome,
            usuarioAtual: req.session.usuario,
            usuarios
        });
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
