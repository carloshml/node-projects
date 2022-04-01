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

module.exports.gerarOrdemSuditos = function (application, req, res , validationResult) {
    if (!req.session.autorizado) {
        const errors = [
            { msg: 'Você não tem acesso a essa área' }
        ];
        res.render('index', { validacao: errors, aviso: {} });
        return;
    }
  
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.redirect('jogo?msg=erro');
        return;
    }
    const dadosForm = req.body;
    dadosForm.jogo = JSON.parse(dadosForm.jogo);
    if (isNaN(Number(dadosForm.quantidade).valueOf())) {
        res.redirect('jogo?msg=quantidadeDeveSerNumerica');
        return;
    }
    if (dadosForm.quantidade > (dadosForm.jogo.suditos - dadosForm.jogo.suditosTrabalhando)) {
        res.redirect('jogo?msg=todoSutidosOcupados');
        return;
    }
    const connection = application.config.dbConection;
    const JogoDAO = new application.app.models.JogoDAO(connection);
    dadosForm.usuario = req.session.usuario;
    JogoDAO.gerarOrdemSuditos(dadosForm);
    res.redirect('jogo?msg=acerto');
}

module.exports.revogarAcao = function (application, req, res) {
    const connection = application.config.dbConection;
    const JogoDAO = new application.app.models.JogoDAO(connection);
    JogoDAO.revogarAcao(req, res);
}