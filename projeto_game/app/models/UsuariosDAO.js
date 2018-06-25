function UsuarioDAO(connection){
    // underline converção para que a variável só funciona nessa função
  this._connection = connection(); 
}

UsuarioDAO.prototype.inserirUsuario = function(usuario){
    this._connection.open(function(err, mongoclient){
        mongoclient.collection("usuarios",
        function(erro, collection){
            collection.insert(usuario); 
            mongoclient.close();
        });
    });  
}

UsuarioDAO.prototype.autenticar = function(usuario, req, res){
    this._connection.open(function(err, mongoclient){
        mongoclient.collection("usuarios",
        function(erro, collection){
           // collection.find({usuario:{$eq:usuario.usuario}, senha:{$eq: usuario.senha}});
           //collection.find({usuario:usuario.usuario, senha: usuario.senha});
           collection.find(usuario).toArray(function(err, result){
               if(result[0]!= undefined){
                   req.session.autorizado = true;
                   req.session.usuario = result[0].usuario;
                   req.session.casa = result[0].casa;
               }else{
                   req.session.autorizado = false; 
               }  

               if(req.session.autorizado){
                   res.redirect('jogo');
               }else{
                var errors= [
                    { msg:'Usuario ou senha Incorreto'}
                ]
                   res.render('index',{validacao:errors,aviso:{}});
                }                    
           });
           mongoclient.close();
        });
    }); 
}

module.exports = function(){
    return UsuarioDAO;
}