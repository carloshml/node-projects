module.exports.buscarUsuarios = function (application, req, res) {
    listaUsuarios(application, req, res, []);
}

async function listaUsuarios(application, req, res, errors) {
    if (req.session.autorizado) {
        var connection = application.config.dbConection;
        var UsuarioDAO = new application.app.models.UsuariosDAO(connection);
        const result = await UsuarioDAO.listarUsuarios();
        req.query.resultados = result;
        const opcoes = req.query;
        opcoes.validacao = errors;
        res.render('usuariosSistema', opcoes);
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
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
        // res.redirect('usuarios-sistema',{validacao:errors, dadosForm: dadosForm});   
        res.redirect('usuarios-sistema');
        return;
    }
    var connection = application.config.dbConection;
    var UsuariosDAO = new application.app.models.UsuariosDAO(connection);
    if (UsuariosDAO.atualizarUsuario(dadosForm, req)) {
        res.redirect('buscarUsuarios?' + dadosForm.id_jogo);
    }
}

async function inserirUsuario(application, req, res) {
    var dadosForm = req.body;
    var connection = application.config.dbConection;
    var UsuariosDAO = new application.app.models.UsuariosDAO(connection);   
    return await UsuariosDAO.inserirUsuario(dadosForm, application);

}

module.exports.inserirUsuario = async function (application, req, res, validationResult) {
    var dadosForm = req.body;
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.render('cadastro', { validacao: errors.array(), dadosForm: dadosForm });
        return;
    }
    const retorno = await inserirUsuario(application, req, res);
    if (retorno === 'sucesso') {
        const aviso = [
            { msg: 'Você Foi Cadastrado com Sucesso!!' }
        ]
        res.render('index', { validacao: {}, aviso });
    } else if (retorno === 'usuarioexiste') {
        var erros = [
            { msg: 'Usuario já existe!!' }
        ];
        dadosForm.senha = undefined;
        res.render('cadastro', { validacao: erros, dadosForm: dadosForm });
    }
}

module.exports.inserirUsuarioCrud = async function (application, req, res, validationResult) {
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('errors  ::: ', errors);
        listaUsuarios(application, req, res, errors.array());
        return;
    }
    const retorno = await inserirUsuario(application, req, res);
    if (retorno === 'sucesso') {
        const aviso = [
            { msg: 'Você Foi Cadastrado com Sucesso!!' }
        ]       
        listaUsuarios(application, req, res, []);
    } else if (retorno === 'usuarioexiste') {
        var erros = [
            { msg: 'Usuario já existe!!' }
        ];        
        listaUsuarios(application, req, res, erros);
    }
}

module.exports.verRanking = async function (application, req, res) {
    if (req.session.autorizado) {
        var connection = application.config.dbConection;
        var UsuarioDAO = new application.app.models.UsuariosDAO(connection);

        var comandoInvalido = false;
        var msg = '';
        if (req.query.msg !== '') {
            msg = req.query.msg;
        }
        await UsuarioDAO.verRanking(res, req, req.session.casa, msg, application);

    } else {
        var errors = [
            { msg: 'Você não tem acesso a essa área' }
        ];
        res.render('index', { validacao: errors, aviso: {} });
    }
}