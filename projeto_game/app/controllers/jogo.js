module.exports.render = function (application, req, res) {
    if (req.session.autorizado) {
        var connection = application.config.dbConection;
        var JogoDAO = new application.app.models.JogoDAO(connection);
        var comandoInvalido = false;
        var msg = '';
        if (req.query.msg !== '') {
            msg = req.query.msg;
        }
        JogoDAO.iniciaJogo(res, req, req.session.casa);
    } else {
        var errors = [
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
        var errors = [
            { msg: 'Você não tem acesso a essa área' }
        ];
        res.render('index', { validacao: errors, aviso: {} });
        return;
    }

    var connection = application.config.dbConection;
    var UsuarioDAO = new application.app.models.UsuariosDAO(connection);
    UsuarioDAO.buscarUsuarioGerarAldeoes(res, req, req.session.casa);


}

module.exports.gerarPergaminhos = function (application, req, res) {
    if (!req.session.autorizado) {
        var errors = [
            { msg: 'Você não tem acesso a essa área' }
        ];
        res.render('index', { validacao: errors, aviso: {} });
        return;
    }
    var connection = application.config.dbConection;
    var JogoDAO = new application.app.models.JogoDAO(connection);
    JogoDAO.gerarPergaminhos(req, res);
}

module.exports.atualizarAcoesDeJogo = function (application, req, res) {
    if (!req.session.autorizado) {
        var errors = [
            { msg: 'Você não tem acesso a essa área' }
        ];
        res.render('index', { validacao: errors, aviso: {} });
        return;
    }
    var connection = application.config.dbConection;
    var JogoDAO = new application.app.models.JogoDAO(connection);
    JogoDAO.atualizarAcoesDeJogo(req, res);

}

module.exports.gerarOrdemSuditos = function (application, req, res) {
    if (!req.session.autorizado) {
        var errors = [
            { msg: 'Você não tem acesso a essa área' }
        ];
        res.render('index', { validacao: errors, aviso: {} });
        return;
    }
    var dadosForm = req.body;
    req.assert('acao', 'acao deve ser informada').notEmpty();
    req.assert('quantidade', 'acao deve ser informada').notEmpty();
    var erros = req.validationErrors();
    if (erros) {
        res.redirect('jogo?msg=erro');
        return;
    }
    dadosForm.jogo = JSON.parse(dadosForm.jogo);
    if (isNaN(Number(dadosForm.quantidade).valueOf())) {
        res.redirect('jogo?msg=quantidadeDeveSerNumerica');
        return;
    }
    if (dadosForm.quantidade > (dadosForm.jogo.suditos - dadosForm.jogo.suditosTrabalhando)) {
        res.redirect('jogo?msg=todoSutidosOcupados');
        return;
    }
    var connection = application.config.dbConection;
    var JogoDAO = new application.app.models.JogoDAO(connection);
    dadosForm.usuario = req.session.usuario;
    JogoDAO.gerarOrdemSuditos(dadosForm);
    res.redirect('jogo?msg=acerto');
}

module.exports.revogarAcao = function (application, req, res) {   
    var connection = application.config.dbConection;
    var JogoDAO = new application.app.models.JogoDAO(connection);
    JogoDAO.revogarAcao(req , res); 
}