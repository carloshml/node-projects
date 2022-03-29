module.exports.render = function (application, req, res) {
    res.render('index', { validacao: {}, aviso: {} });
}

module.exports.irParaHome = function (application, req, res) {
    if (req.session.autorizado) {
        var connection = application.config.dbConection;
        var UsuarioDAO = new application.app.models.UsuariosDAO(connection);
        var comandoInvalido = false;
        var msg = '';
        if (req.query.msg !== '') {
            msg = req.query.msg;
        }
        UsuarioDAO.irParaHome(res, req.session.usuario, req.session.casa, msg, req);
    } else {
        var errors = [
            { msg: 'Você não tem acesso a essa área' }
        ];
        res.render('index', { validacao: errors, aviso: {} });
    }
}


