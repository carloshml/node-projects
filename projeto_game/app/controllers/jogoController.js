module.exports.iniciaJogo = function (application, req, res) {
    if (req.session.autorizado) {
        const connection = application.config.dbConection;
        const JogoDAO = new application.app.models.JogoDAO(connection);
        const comandoInvalido = false;      
        JogoDAO.iniciaJogo(res, req, req.session.casa);
    } else {
        const errors = [
            { msg: 'Você não tem acesso a essa área' }
        ]
        res.render('index', { validacao: errors, aviso: {} });
    }
}

module.exports.sair = function (application, req, res) {
    req.session.destroy(function (erro) {
        res.render('index', { validacao: {}, aviso: {} });
    });
}

module.exports.gerarSuditos = function (application, req, res) {
    if (!req.session.autorizado) {
        const errors = [
            { msg: 'Você não tem acesso a essa área' }
        ];
        res.render('index', { validacao: errors, aviso: {} });
        return;
    }

    const connection = application.config.dbConection;
    const UsuarioDAO = new application.app.models.UsuariosDAO(connection);
    UsuarioDAO.buscarUsuarioGerarAldeoes(res, req, req.session.casa);


}

module.exports.gerarPergaminhos = function (application, req, res) {
    if (!req.session.autorizado) {
        const errors = [
            { msg: 'Você não tem acesso a essa área' }
        ];
        res.render('index', { validacao: errors, aviso: {} });
        return;
    }
    const connection = application.config.dbConection;
    const JogoDAO = new application.app.models.JogoDAO(connection);
    JogoDAO.gerarPergaminhos(req, res);
}

module.exports.historicoAcoes = function (application, req, res) {
    if (!req.session.autorizado) {
        res.status(401).json({ ok: false, msg: 'Você não tem acesso a essa área' });
        return;
    }
    const connection = application.config.dbConection;
    const JogoDAO = new application.app.models.JogoDAO(connection);
    JogoDAO.historicoAcoes(req, res);
}

module.exports.atualizarAcoesDeJogo = function (application, req, res) {
    if (!req.session.autorizado) {
        const errors = [
            { msg: 'Você não tem acesso a essa área' }
        ];
        res.render('index', { validacao: errors, aviso: {} });
        return;
    }
    const connection = application.config.dbConection;
    const JogoDAO = new application.app.models.JogoDAO(connection);
    JogoDAO.atualizarAcoesDeJogo(req, res);

}

module.exports.gerarOrdemSuditos = async function (application, req, res, validationResult) {
    if (!req.session.autorizado) {
        const errors = [
            { msg: 'Você não tem acesso a essa área' }
        ];
        res.render('index', { validacao: errors, aviso: {} });
        return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.redirect('/jogo?msg=erro');
        return;
    }

    const dadosForm = req.body;
    try {
        dadosForm.jogo = JSON.parse(dadosForm.jogo);
    } catch (erro) {
        res.redirect('/jogo?msg=erro');
        return;
    }

    const quantidade = parseInt(dadosForm.quantidade, 10);
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
        res.redirect('/jogo?msg=quantidadeDeveSerNumerica');
        return;
    }

    if (quantidade > (Number(dadosForm.jogo.suditos) - Number(dadosForm.jogo.suditosTrabalhando))) {
        res.redirect('/jogo?msg=todoSutidosOcupados');
        return;
    }

    const connection = application.config.dbConection;
    const JogoDAO = new application.app.models.JogoDAO(connection);
    dadosForm.quantidade = quantidade;
    dadosForm.usuario = req.session.usuario;
    dadosForm.idUsuario = req.session._id;

    try {
        /* o DAO revalida saldo e aldeões livres direto no banco */
        const resultado = await JogoDAO.gerarOrdemSuditos(dadosForm);
        if (!resultado.ok) {
            res.redirect('/jogo?msg=' + resultado.msg);
            return;
        }
        res.redirect('/jogo?msg=acerto');
    } catch (erro) {
        console.log('  algum erro foi encontrado  ', erro);
        res.redirect('/jogo?msg=erro');
    }
}

module.exports.revogarAcao = function (application, req, res) {
    const connection = application.config.dbConection;
    const JogoDAO = new application.app.models.JogoDAO(connection);
    JogoDAO.revogarAcao(req, res);
}

module.exports.buscaJogoUsuario = function (application, req, res) {
    if (!req.session.autorizado) {
        var errors = [
            { msg: 'Você não tem acesso a essa área' }
        ];
        res.render('index', { validacao: errors, aviso: {} });
        return;
    }
    var connection = application.config.dbConection;
    var JogoDAO = new application.app.models.JogoDAO(connection);
    JogoDAO.buscaJogoUsuario(res, req, req.session.casa);
}

module.exports.venderRecurso = function (application, req, res) {
    if (!req.session.autorizado) {
        res.status(401).json({ ok: false, msg: 'Você não tem acesso a essa área' });
        return;
    }
    const connection = application.config.dbConection;
    const JogoDAO = new application.app.models.JogoDAO(connection);
    JogoDAO.venderRecurso(req, res);
}