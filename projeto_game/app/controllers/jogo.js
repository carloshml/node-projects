module.exports.render = function(application, req, res){
   if(req.session.autorizado){
    var connection = application.config.dbConection;
    var JogoDAO = new application.app.models.JogoDAO(connection);
  
    var  comandoInvalido = false;

    if(req.query.comando_invalido == 'true'){
        comandoInvalido = true;
    }
    console.log('----------',comandoInvalido);

    JogoDAO.iniciaJogo(res, req.session.usuario, req.session.casa,comandoInvalido );

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
    res. render('pergaminhos');
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
        res.redirect('jogo?comando_invalido=true');
        return;
    }
    console.log(dadosForm);
    res.send('tudo ok!');

}