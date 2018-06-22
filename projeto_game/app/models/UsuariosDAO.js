function UsuarioDAO(connection){
    // underline converção para que a variável só funciona nessa função
  this._connection = connection();
    

}

UsuarioDAO.prototype.inserirUsuario = function(usuario){
    // this._connection.open(function(err, mongoclient){
    //     mongoclient.collection("usuarios",
    //     function(erro, collection){
    //         collection.insert(usuario);

    //     });
    // });   

    console.log(this._connection);    
    
  

}

module.exports = function(){
    return UsuarioDAO;
}