module.exports.buscarUsuarios = function (application, req, res) {
    if (req.session.autorizado) {
        var connection  = application.config.dbConection;
        var UsuarioDAO = new application.app.models.UsuariosDAO(connection);

        var comandoInvalido = false;
        var msg = '';
        if (req.query.msg !== '') {
            msg = req.query.msg;
        }
        UsuarioDAO.buscarUsuarios(res, req, req.session.casa, msg);
    } else {
        var errors = [
            { msg: 'Você não tem acesso a essa área' }
        ];
        res.render('index', { validacao: errors, aviso: {} });
    }
}

module.exports.render = function (application, req, res) {
    res.render('cadastro', { validacao: {}, dadosForm: {} });
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
    var UsuarioDAO = new application.app.models.UsuariosDAO(connection);
    UsuarioDAO.buscaJogoUsuario(res, req, req.session.casa);
}

module.exports.autenticar = function (application, req, res, validationResult) {
    var dadosForm = req.body;
    var errors = validationResult(req);    
    if (!errors.isEmpty()) {
        res.render('index', { validacao: errors.array(), aviso: {} });
        return;
    }
    var connection = application.config.dbConection;
    var UsuariosDAO = new application.app.models.UsuariosDAO(connection);
    UsuariosDAO.autenticar(dadosForm, req, res);
    //res.send('tudo certo para criar a sessão');
}

module.exports.atualizarUsuario = function (application, req, res, validationResult) {
    var dadosForm = req.body;  
    var errors = validationResult (req) ;
    if (!errors.isEmpty()) {
        // res.redirect('usuarios-sistema',{validacao:errors, dadosForm: dadosForm});   
        res.redirect('usuarios-sistema');
        return;
    }
    var connection = application.config.dbConection;
    var UsuariosDAO = new application.app.models.UsuariosDAO(connection);
    UsuariosDAO.atualizarUsuario(dadosForm, req, res);

    var avisos = [
        { msg: 'Você Foi Cadastrado com Sucesso!!' }
    ]
    // res.render('usuarios-sistema',{validacao:{},aviso:avisos});
    // res.redirect('usuarios-sistema');    

}

module.exports.inserirUsuario = function (application, req, res, validationResult) {
    var dadosForm = req.body;
    var errors = validationResult(req);
    if (!errors.isEmpty()) {       
        res.render('cadastro', { validacao: errors.array(), dadosForm: dadosForm });
        return;
    }
    var connection = application.config.dbConection;
    var UsuariosDAO = new application.app.models.UsuariosDAO(connection);
    UsuariosDAO.inserirUsuario(dadosForm, application, res);

}