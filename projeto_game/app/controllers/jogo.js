module.exports.render = function(application, req, res){
   if(req.session.autorizado){
       res.render('jogo',{img_casa:req.session.casa});
   }else{
        var errors= [
            { msg:'Você não tem acesso a essa área'}
        ]
           res.render('index',{validacao:errors,aviso:avisos});          
       }
}

module.exports.sair = function(application, req, res){
    req.session.destroy(function(erro){
        res. render('index',{validacao:{},aviso:{}});
    });
 }