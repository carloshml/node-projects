module.exports.render = function(application, req, res){
   if(req.session.autorizado){
       res.render('jogo');
   }else{
        var errors= [
            { msg:'Você não tem acesso a essa área'}
        ]
           res.render('index',{validacao:errors});
       }
}

module.exports.sair = function(application, req, res){
    req.session.destroy(function(erro){
        res.render('index',{validacao:{}});
    });
 }