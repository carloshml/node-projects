module.exports.render = function(application, req, res){
    res.render('cadastro',{validacao:{}, dadosForm: {}});
}

module.exports.cadastar = function(application, req, res){
    var dadosForm = req.body;

    req.assert('nome','nome não pode ser vazio').notEmpty();
    req.assert('usuario','usuário não pode ser vazio').notEmpty();
    req.assert('senha','senha não pode ser vazio').notEmpty();
    req.assert('casa','casa não pode ser vazio').notEmpty();

    var errors = req.validationErrors();

    if(errors){
        res.render('cadastro',{validacao:errors, dadosForm: dadosForm});        
        return;
    }

    var connection = application.config.dbConection;
 
    var UsuariosDAO = new application.app.models.UsuariosDAO(connection);
    UsuariosDAO.inserirUsuario(dadosForm); 
       // geração dos parametros
    var JogoDAO = new application.app.models.JogoDAO(connection);
    JogoDAO.gerarParametros(dadosForm.usuario);

    var avisos= [
        { msg:'Você Foi Cadastrado com Sucesso!!'}
    ]   
    res.render('index',{validacao:{},aviso:avisos});
}