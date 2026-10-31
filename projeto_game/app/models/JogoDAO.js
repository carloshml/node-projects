let ObjectId = require('mongodb').ObjectId;
const { FERAS, PODER_ALDEAO, obterFera } = require('./feras');

/* custo em moedas por aldeão, por tipo de ação */
const CUSTOS = { 1: 2, 2: 3, 3: 1, 4: 1, 5: 5, 6: 2000 };

/* duração em milissegundos por aldeão, por tipo de ação */
const DURACOES = { 1: 10000, 2: 120000, 3: 180000, 4: 240000, 5: 30000, 6: 180000 };

/* requisitos fixos para treinar um campeão */
const CAMPEAO = {
    moeda: 2000,
    madeira: 100,
    ferro: 50,
    duracao: 180000,
    requisitos: { temor: 150, sabedoria: 150, magia: 100 },
    ataquePorNivel: 10,
    niveisPorBonus: 3,
    bonusMoeda: 0.1
};

/* o que cada aldeão produz ao terminar a ação */
const RECOMPENSAS = {
    1: { madeira: 5, comida: 2, ferro: 1 },
    2: { temor: 5 },
    3: { sabedoria: 5 },
    4: { magia: 5 }
};

/* preço base de venda de cada recurso (em moedas) */
const PRECOS = { madeira: 1, comida: 2, ferro: 3 };

/* custo para contratar um novo aldeão */
const CUSTO_ALDEAO = 10000;

/* recursos ficam dentro de jogo.recursos; habilidades ficam na raiz */
const CAMPOS_RECURSO = ['madeira', 'comida', 'ferro'];

function campoDoBanco(campo) {
    return CAMPOS_RECURSO.indexOf(campo) !== -1 ? 'recursos.' + campo : campo;
}

/* o driver 4.x devolve { value: doc }; versões novas devolvem o doc direto */
function documentoDe(resultado) {
    if (!resultado) {
        return null;
    }
    if (Object.prototype.hasOwnProperty.call(resultado, 'value')) {
        return resultado.value;
    }
    return resultado;
}

function responderJson(res, status, corpo) {
    if (res.headersSent) {
        return;
    }
    res.status(status);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(corpo));
}

function ganhosDaAcao(acao) {
    const tipo = parseInt(acao.acao, 10);
    const quantidade = Number(acao.quantidade) || 0;
    const ganhos = {};
    const base = RECOMPENSAS[tipo] || {};
    Object.keys(base).forEach(function (campo) {
        ganhos[campo] = base[campo] * quantidade;
    });
    return ganhos;
}

function resultadoDaAcao(acao) {
    const tipo = parseInt(acao.acao, 10);
    const quantidade = Number(acao.quantidade) || 0;

    if (tipo === 5) {
        const fera = obterFera(acao.fera);
        const campeao = Number(acao.campeao) || 0;
        const ataque = Number(acao.ataque) || (quantidade * PODER_ALDEAO);

        if (!fera) {
            return { ganhos: {}, vitoria: false, fera: null, ataque: ataque, vida: null, minimo: null };
        }

        const vitoria = ataque >= fera.vida;
        const multiplicador = 1 + (Math.floor(campeao / CAMPEAO.niveisPorBonus) * CAMPEAO.bonusMoeda);
        return {
            ganhos: vitoria
                ? {
                    moeda: Math.round(fera.recompensa * multiplicador),
                    temor: Math.ceil(fera.vida / 3)
                }
                : {},
            vitoria: vitoria,
            fera: fera.id,
            ataque: ataque,
            vida: fera.vida,
            minimo: fera.minimo
        };
    }

    return { ganhos: ganhosDaAcao(acao), vitoria: null, fera: null };
}

/* instante em que o dano acumulado derruba a fera; null quando não há vitória */
function instanteDaVitoria(acao) {
    if (String(acao.acao) !== '5') {
        return null;
    }

    const fera = obterFera(acao.fera);
    if (!fera) {
        return null;
    }

    const quantidade = Number(acao.quantidade) || 0;
    const ataque = Number(acao.ataque) || (quantidade * PODER_ALDEAO);
    if (ataque < fera.vida) {
        return null;
    }

    const duracao = Number(acao.duracao_ms) || (DURACOES[5] * quantidade);
    const inicio = Number(acao.acao_iniciada_em);
    const termina = Number(acao.acao_termina_em);
    const inicioConfiavel = Number.isFinite(inicio) && inicio > 0
        ? inicio
        : termina - duracao;

    if (!Number.isFinite(inicioConfiavel) || !(duracao > 0)) {
        return null;
    }

    return inicioConfiavel + (duracao * (fera.vida / ataque));
}

function acaoConcluida(acao, agora) {
    if (acao.terminado === true) {
        return true;
    }
    if (Number(acao.acao_termina_em) <= agora) {
        return true;
    }

    const vitoriaEm = instanteDaVitoria(acao);
    return vitoriaEm !== null && agora >= vitoriaEm;
}

function JogoDAO(connection) {
    this._connection = connection;
}

JogoDAO.PRECOS = PRECOS;

JogoDAO.prototype.gerarParametrosJogo = async function (id, usuario) {
    const conexao = await this._connection.getDB();

    try {
        await conexao.db.collection("jogo").insertOne({
            usuario: usuario,
            idUsuario: id,
            moeda: 15,
            suditos: 10,
            suditosTrabalhando: 0,
            temor: Math.floor(Math.random() * 1000),
            sabedoria: Math.floor(Math.random() * 1000),
            comercio: Math.floor(Math.random() * 1000),
            magia: Math.floor(Math.random() * 1000),
            campeao: 0,
            recursos: { madeira: 0, comida: 0, ferro: 0 }
        });
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
    } finally {
        await conexao.client.close();
    }
}

JogoDAO.prototype.iniciaJogo = async function (res, req, casa, msg) {
    const usuarioId = req.session._id;
    const conexao = await this._connection.getDB();

    try {
        const result = await conexao.db.collection("jogo")
            .find({ idUsuario: new ObjectId(usuarioId) })
            .toArray();

        if (!result || !result[0]) {
            res.redirect('/');
            return;
        }

        const jogo = result[0];
        jogo.nome = req.session.nome;
        jogo.recursos = jogo.recursos || {};
        jogo.precos = PRECOS;
        jogo.feras = FERAS;
        jogo.campeao = Number(jogo.campeao) || 0;
        jogo.campeaoAtaque = jogo.campeao * CAMPEAO.ataquePorNivel;
        jogo.campeaoBonusMoeda = Math.floor(jogo.campeao / CAMPEAO.niveisPorBonus) * CAMPEAO.bonusMoeda;
        res.render('jogo', { img_casa: casa, jogo: jogo, msg: msg });
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
    } finally {
        await conexao.client.close();
    }
}

JogoDAO.prototype.gerarOrdemSuditos = async function (acao) {
    const conexao = await this._connection.getDB();
    const db = conexao.db;
    try {
        const tipo = parseInt(acao.acao, 10);
        let quantidade = parseInt(acao.quantidade, 10);

        /* o treinamento do campeão usa exatamente um aldeão */
        if (tipo === 6) {
            quantidade = 1;
        }

        if (!CUSTOS[tipo] || !(quantidade > 0)) {
            return { ok: false, msg: 'erro' };
        }

        /* a fera é sorteada pelo jogo; o jogador não escolhe */
        const fera = tipo === 5
            ? FERAS[Math.floor(Math.random() * FERAS.length)]
            : null;

        const custo = CUSTOS[tipo] * quantidade;
        /* usa o usuário da sessão, não o id vindo do formulário */
        const filtroJogo = acao.idUsuario
            ? { idUsuario: new ObjectId(acao.idUsuario) }
            : { _id: new ObjectId(acao.jogo._id) };

        const filtroDebito = {
            ...filtroJogo,
            moeda: { $gte: custo },
            $expr: { $gte: [{ $subtract: ['$suditos', '$suditosTrabalhando'] }, quantidade] }
        };
        const incrementosDebito = {
            moeda: -custo,
            suditosTrabalhando: quantidade
        };

        if (tipo === 6) {
            filtroDebito['recursos.madeira'] = { $gte: CAMPEAO.madeira };
            filtroDebito['recursos.ferro'] = { $gte: CAMPEAO.ferro };
            filtroDebito.temor = { $gte: CAMPEAO.requisitos.temor };
            filtroDebito.sabedoria = { $gte: CAMPEAO.requisitos.sabedoria };
            filtroDebito.magia = { $gte: CAMPEAO.requisitos.magia };
            incrementosDebito['recursos.madeira'] = -CAMPEAO.madeira;
            incrementosDebito['recursos.ferro'] = -CAMPEAO.ferro;
        }

        /* debita moedas/recursos e ocupa os aldeões de forma atômica */
        const debito = await db.collection("jogo").findOneAndUpdate(
            filtroDebito,
            { $inc: incrementosDebito },
            { returnDocument: 'after' }
        );

        const jogoAposDebito = documentoDe(debito);
        if (!jogoAposDebito) {
            const jogo = await db.collection("jogo").findOne(filtroJogo);
            if (!jogo) {
                return { ok: false, msg: 'erro' };
            }

            const livres = (Number(jogo.suditos) || 0) - (Number(jogo.suditosTrabalhando) || 0);
            if (livres < quantidade) {
                return { ok: false, msg: 'todoSutidosOcupados' };
            }
            if (Number(jogo.moeda) < custo) {
                return { ok: false, msg: 'semMoeda' };
            }
            if (tipo === 6) {
                const recursos = jogo.recursos || {};
                if ((Number(recursos.madeira) || 0) < CAMPEAO.madeira ||
                    (Number(recursos.ferro) || 0) < CAMPEAO.ferro) {
                    return { ok: false, msg: 'semRecursosCampeao' };
                }
                if ((Number(jogo.temor) || 0) < CAMPEAO.requisitos.temor ||
                    (Number(jogo.sabedoria) || 0) < CAMPEAO.requisitos.sabedoria ||
                    (Number(jogo.magia) || 0) < CAMPEAO.requisitos.magia) {
                    return { ok: false, msg: 'requisitosCampeao' };
                }
            }
            return { ok: false, msg: 'erro' };
        }

        const agora = new Date().getTime();
        let duracao = DURACOES[tipo] * quantidade;

        /* a batalha termina quando o dano acumulado zera a vida da fera */
        const campeao = Number(jogoAposDebito.campeao) || 0;
        const ataque = tipo === 5
            ? (quantidade * PODER_ALDEAO) + (campeao * CAMPEAO.ataquePorNivel)
            : 0;

        if (tipo === 5 && fera && ataque >= fera.vida) {
            duracao = Math.max(1000, Math.round(duracao * (fera.vida / ataque)));
        }

        const novaAcao = {
            usuario: acao.usuario,
            acao: String(tipo),
            quantidade: quantidade,
            custo: custo,
            acao_iniciada_em: agora,
            acao_termina_em: agora + duracao,
            duracao_ms: duracao,
            terminado: false
        };

        if (fera) {
            novaAcao.fera = fera.id;
            novaAcao.ataque = ataque;
            novaAcao.campeao = campeao;
        }

        try {
            await db.collection("acao").insertOne(novaAcao);
        } catch (erroInsercao) {
            /* se não conseguiu registrar a ordem, devolve o que foi debitado */
            const reembolso = {
                moeda: custo,
                suditosTrabalhando: -quantidade
            };
            if (tipo === 6) {
                reembolso['recursos.madeira'] = CAMPEAO.madeira;
                reembolso['recursos.ferro'] = CAMPEAO.ferro;
            }

            await db.collection("jogo").updateOne(
                filtroJogo,
                { $inc: reembolso }
            );
            throw erroInsercao;
        }

        return { ok: true };
    } finally {
        await conexao.client.close();
    }
}

JogoDAO.prototype.gerarPergaminhos = async function (req, res) {
    const usuario = req.session.usuario;
    const conexao = await this._connection.getDB();

    try {
        const momento_atual = new Date().getTime();
        const candidatas = await conexao.db.collection("acao")
            .find({ usuario: usuario, terminado: { $ne: true } })
            .toArray();

        const acoesNaoTerminadas = candidatas.filter(function (acao) {
            return !acaoConcluida(acao, momento_atual);
        });

        const jsonContent = JSON.stringify({ acoes: acoesNaoTerminadas });
        res.setHeader("Content-Type", "application/json");
        res.end(jsonContent);
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
        responderJson(res, 500, { ok: false, msg: 'erro' });
    } finally {
        await conexao.client.close();
    }
}

JogoDAO.prototype.atualizarAcoesDeJogo = async function (req, res) {
    const usuario = req.session.usuario;
    const usuarioId = req.session._id;
    let conexao;

    try {
        conexao = await this._connection.getDB();
        const db = conexao.db;

        const jogo = await db.collection("jogo").findOne({ idUsuario: new ObjectId(usuarioId) });
        if (!jogo) {
            responderJson(res, 404, { ok: false, msg: 'jogoNaoEncontrado' });
            return;
        }

        const momento_atual = new Date().getTime();
        const candidatas = await db.collection("acao")
            .find({
                usuario: usuario,
                $or: [
                    { terminado: { $ne: true } },
                    /* ordens antigas que o código anterior encerrou sem pagar recompensa */
                    { terminado: true, recompensado: { $ne: true } }
                ]
            })
            .toArray();

        const acoesTerminadas = candidatas.filter(function (acao) {
            return acao.terminado === true || acaoConcluida(acao, momento_atual);
        });

        const concluidas = [];

        for (const acao of acoesTerminadas) {
            const pendente = acao.terminado === true;

            /* garante que cada ordem seja paga exatamente uma vez */
            const reivindicada = await db.collection("acao").findOneAndUpdate(
                pendente
                    ? { _id: acao._id, terminado: true, recompensado: { $ne: true } }
                    : { _id: acao._id, terminado: false },
                {
                    $set: pendente
                        ? { recompensado: true }
                        : { terminado: true, recompensado: true, terminado_em: momento_atual }
                }
            );

            if (!documentoDe(reivindicada)) {
                continue;
            }

            const quantidade = Number(acao.quantidade) || 0;
            const resultado = resultadoDaAcao(acao);
            const ganhos = resultado.ganhos;
            const incrementos = {};

            /* ordens antigas já tiveram os aldeões liberados pelo código anterior */
            if (!pendente) {
                incrementos.suditosTrabalhando = -quantidade;
            }

            Object.keys(ganhos).forEach(function (campo) {
                incrementos[campoDoBanco(campo)] = ganhos[campo];
            });

            if (String(acao.acao) === '6') {
                incrementos.campeao = 1;
            }

            if (Object.keys(incrementos).length > 0) {
                await db.collection("jogo").updateOne({ _id: jogo._id }, { $inc: incrementos });
            }

            concluidas.push({
                acao: acao.acao,
                quantidade: quantidade,
                ganhos: ganhos,
                vitoria: resultado.vitoria,
                fera: resultado.fera,
                ataque: resultado.ataque,
                vida: resultado.vida,
                minimo: resultado.minimo,
                campeao: String(acao.acao) === '6',
                pendente: pendente
            });
        }

        if (concluidas.length > 0) {
            /* proteção contra dados antigos que deixaram o contador negativo */
            await db.collection("jogo").updateOne(
                { _id: jogo._id, suditosTrabalhando: { $lt: 0 } },
                { $set: { suditosTrabalhando: 0 } }
            );
        }

        responderJson(res, 200, { ok: true, concluidas: concluidas });
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
        responderJson(res, 500, { ok: false, msg: 'erro' });
    } finally {
        if (conexao) {
            await conexao.client.close();
        }
    }
}

JogoDAO.prototype.revogarAcao = async function (req, res) {
    const idAcao = req.query.id_acao;
    const usuario = req.session.usuario;
    let conexao;

    try {
        conexao = await this._connection.getDB();
        const db = conexao.db;

        const acao = await db.collection("acao").findOne({
            _id: new ObjectId(idAcao),
            usuario: usuario
        });

        if (!acao) {
            res.redirect('/jogo?msg=erro');
            return;
        }

        /* a fera já foi revelada; revogar permitiria sortear outra */
        if (parseInt(acao.acao, 10) === 5) {
            res.redirect('/jogo?msg=batalhaEmCurso');
            return;
        }

        /* o treinamento consome recursos e não deve ser interrompido */
        if (parseInt(acao.acao, 10) === 6) {
            res.redirect('/jogo?msg=treinamentoEmCurso');
            return;
        }

        if (acao.terminado || Number(acao.acao_termina_em) <= new Date().getTime()) {
            res.redirect('/jogo?msg=acaoJaConcluida');
            return;
        }

        /* só devolve o dinheiro de quem realmente conseguiu remover a ordem */
        const removida = await db.collection("acao").deleteOne({ _id: acao._id, terminado: false });

        if (removida.deletedCount > 0) {
            const quantidade = Number(acao.quantidade) || 0;
            const custo = Number(acao.custo) || (CUSTOS[parseInt(acao.acao, 10)] || 0) * quantidade;
            const jogo = await db.collection("jogo").findOne({ idUsuario: new ObjectId(req.session._id) });

            if (jogo) {
                await db.collection("jogo").updateOne(
                    { _id: jogo._id },
                    { $inc: { moeda: custo, suditosTrabalhando: -quantidade } }
                );
                await db.collection("jogo").updateOne(
                    { _id: jogo._id, suditosTrabalhando: { $lt: 0 } },
                    { $set: { suditosTrabalhando: 0 } }
                );
            }
        }

        res.redirect('/jogo?msg=Deleted');
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
        res.redirect('/jogo?msg=erro');
    } finally {
        if (conexao) {
            await conexao.client.close();
        }
    }
}

JogoDAO.prototype.venderRecurso = async function (req, res) {
    const recurso = String((req.body && req.body.recurso) || '');
    const quantidade = parseInt(req.body && req.body.quantidade, 10);
    let conexao;

    try {
        if (!PRECOS[recurso]) {
            responderJson(res, 400, { ok: false, msg: 'Recurso inválido.' });
            return;
        }
        if (!Number.isInteger(quantidade) || quantidade <= 0) {
            responderJson(res, 400, { ok: false, msg: 'Quantidade inválida.' });
            return;
        }

        conexao = await this._connection.getDB();
        const db = conexao.db;

        const jogo = await db.collection("jogo").findOne({ idUsuario: new ObjectId(req.session._id) });
        if (!jogo) {
            responderJson(res, 404, { ok: false, msg: 'Jogo não encontrado.' });
            return;
        }

        const disponivel = Number(jogo.recursos && jogo.recursos[recurso]) || 0;
        if (disponivel < quantidade) {
            responderJson(res, 400, { ok: false, msg: 'Recursos insuficientes.' });
            return;
        }

        const comercio = Number(jogo.comercio) || 0;
        const precoUnitario = Math.max(1, Math.round(PRECOS[recurso] * (1 + comercio / 1000)));
        const ganho = precoUnitario * quantidade;

        const atualizado = await db.collection("jogo").findOneAndUpdate(
            { _id: jogo._id, ['recursos.' + recurso]: { $gte: quantidade } },
            { $inc: { ['recursos.' + recurso]: -quantidade, moeda: ganho } },
            { returnDocument: 'after' }
        );

        const documento = documentoDe(atualizado);
        if (!documento) {
            responderJson(res, 409, { ok: false, msg: 'Recursos insuficientes.' });
            return;
        }

        responderJson(res, 200, {
            ok: true,
            ganho: ganho,
            moeda: documento.moeda,
            recursos: documento.recursos || {}
        });
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
        responderJson(res, 500, { ok: false, msg: 'Não foi possível vender o recurso.' });
    } finally {
        if (conexao) {
            await conexao.client.close();
        }
    }
}

JogoDAO.prototype.historicoAcoes = async function (req, res) {
    const conexao = await this._connection.getDB();

    try {
        const acoes = await conexao.db.collection("acao")
            .find({ usuario: req.session.usuario, terminado: true })
            .sort({ _id: -1 })
            .limit(30)
            .toArray();

        const historico = acoes.map(function (acao) {
            const resultado = resultadoDaAcao(acao);
            const fera = acao.fera ? obterFera(acao.fera) : null;

            return {
                acao: acao.acao,
                quantidade: Number(acao.quantidade) || 0,
                ganhos: resultado.ganhos || {},
                vitoria: resultado.vitoria,
                fera: resultado.fera,
                feraNome: fera ? fera.nome : null,
                custo: Number(acao.custo) || null,
                terminado_em: acao.terminado_em || acao.acao_termina_em || null
            };
        });

        responderJson(res, 200, { ok: true, historico: historico });
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
        responderJson(res, 500, { ok: false, msg: 'erro' });
    } finally {
        await conexao.client.close();
    }
}

JogoDAO.prototype.comprarAldeao = async function (req, res) {
    const conexao = await this._connection.getDB();
    const filtro = { idUsuario: new ObjectId(req.session._id) };

    try {
        const atualizado = await conexao.db.collection("jogo").findOneAndUpdate(
            { ...filtro, moeda: { $gte: CUSTO_ALDEAO } },
            { $inc: { moeda: -CUSTO_ALDEAO, suditos: 1 } },
            { returnDocument: 'after' }
        );

        const jogo = documentoDe(atualizado);
        if (!jogo) {
            const existente = await conexao.db.collection("jogo").findOne(filtro);
            if (!existente) {
                responderJson(res, 404, { ok: false, msg: 'jogoNaoEncontrado' });
                return;
            }
            responderJson(res, 400, {
                ok: false,
                msg: 'moedasInsuficientes',
                moeda: Number(existente.moeda) || 0,
                custo: CUSTO_ALDEAO
            });
            return;
        }

        responderJson(res, 200, {
            ok: true,
            moeda: Number(jogo.moeda) || 0,
            suditos: Number(jogo.suditos) || 0,
            suditosTrabalhando: Number(jogo.suditosTrabalhando) || 0,
            custo: CUSTO_ALDEAO
        });
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
        responderJson(res, 500, { ok: false, msg: 'erro' });
    } finally {
        await conexao.client.close();
    }
}

JogoDAO.prototype.buscaJogoUsuario = async function (res, req, casa, msg) {
    const usuarioId = req.session._id;
    const conexao = await this._connection.getDB();

    try {
        const result = await conexao.db.collection("jogo")
            .find({ idUsuario: new ObjectId(usuarioId) })
            .toArray();

        if (!result || !result[0]) {
            res.status(404).send({ ok: false, msg: 'jogoNaoEncontrado' });
            return;
        }

        const jogo = result[0];
        jogo.nome = req.session.nome;
        jogo.recursos = jogo.recursos || {};
        jogo.precos = PRECOS;
        jogo.feras = FERAS;
        jogo.campeao = Number(jogo.campeao) || 0;
        jogo.campeaoAtaque = jogo.campeao * CAMPEAO.ataquePorNivel;
        jogo.campeaoBonusMoeda = Math.floor(jogo.campeao / CAMPEAO.niveisPorBonus) * CAMPEAO.bonusMoeda;
        res.send({ img_casa: casa, jogo: jogo, msg: msg });
    } catch (error) {
        console.log('  algum erro foi encontrado  ', error);
        if (!res.headersSent) {
            res.status(500).send({ ok: false, msg: 'erro' });
        }
    } finally {
        await conexao.client.close();
    }
}

module.exports = function () {
    return JogoDAO;
}
