module.exports.render = function(application, req, res){
    res.render('index',{validacao:{}}); 
}

module.exports.autenticar = function(application, req, res){
    var dadosForm = req.body;

    req.assert('usuario','Usuário não deve ser vazio').notEmpty();
    req.assert('senha','Senha não deve ser vazia').notEmpty();
    var errors = req.validationErrors();

    if(errors){
        res.render('index',{validacao:errors}); 
        return;
    }
    var connection = application.config.dbConection;
    var UsuariosDAO = new application.app.models.UsuariosDAO(connection); 
    UsuariosDAO.autenticar(dadosForm, req, res);
    //res.send('tudo certo para criar a sessão');
}
