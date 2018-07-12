module.exports.render = function(application, req, res){
   if(req.session.autorizado){
    var connection = application.config.dbConection;
    var JogoDAO = new application.app.models.JogoDAO(connection);
  
    var  comandoInvalido = false;
    var msg ='';
    if(req.query.msg !== ''){
        msg = req.query.msg;
    }
    

    JogoDAO.iniciaJogo(res, req.session.usuario, req.session.casa,msg );

   }else{
        var errors= [
            { msg:'Você não tem acesso a essa área'}
        ]
           res.render('index',{validacao:errors,aviso:{}});          
       }

}

module.exports.sair = function(application, req, res){
    req.session.destroy(function(erro){
        res. render('index',{validacao:{},aviso:{}});
    });
 }

 module.exports.gerarSuditos = function(application, req, res){
    if(!req.session.autorizado){
        var errors= [
            { msg:'Você não tem acesso a essa área'}
        ];
        res.render('index',{validacao:errors,aviso:{}}); 
        return;
    }
    res. render('aldeoes');
 }

 module.exports.gerarPergaminhos = function(application, req, res){
    if(!req.session.autorizado){
        var errors= [
            { msg:'Você não tem acesso a essa área'}
        ];
        res.render('index',{validacao:errors,aviso:{}}); 
        return;
    }
    var connection = application.config.dbConection;
    var JogoDAO = new application.app.models.JogoDAO(connection);   
    JogoDAO.getAcoes(req.session.usuario ,res); 
    
 }

 module.exports.gerarOrdemSuditos = function(application, req, res){
    if(!req.session.autorizado){
        var errors= [
            { msg:'Você não tem acesso a essa área'}
        ];
        res.render('index',{validacao:errors,aviso:{}}); 
        return;
    }
    var dadosForm = req.body;

    req.assert('acao','acao deve ser informada').notEmpty();
    req.assert('quantidade','acao deve ser informada').notEmpty();
    var erros = req.validationErrors();

    if(erros){
        res.redirect('jogo?msg=erro');
        return;
    }
    var connection = application.config.dbConection;
    var JogoDAO = new application.app.models.JogoDAO(connection);
    dadosForm.usuario = req.session.usuario;
    JogoDAO.acao(dadosForm);
    res.redirect('jogo?msg=acerto');
}

module.exports.revogarAcao = function(application, req, res){
  let url_query = req.query;  
  var connection = application.config.dbConection;
  var JogoDAO = new application.app.models.JogoDAO(connection);
  JogoDAO.revogarAcao(url_query.id_acao,res);
}