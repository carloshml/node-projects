function JogoDAO(connection){
   this._connection = connection(); 
}

JogoDAO.prototype.gerarParametros = function(usuario){
    this._connection.open(function(err, mongoclient){
        mongoclient.collection("jogo",
        function(erro, collection){
            collection.insert({
                usuario:usuario,
                moeda:15,
                suditos:10,
                temor:Math.floor(Math.random()*1000),
                sabedoria:Math.floor(Math.random()*1000),
                comercio:Math.floor(Math.random()*1000),
                magia:Math.floor(Math.random()*1000),
            }); 
            mongoclient.close();
        });
    });  
}

JogoDAO.prototype.iniciaJogo = function( res, usuario, casa, comandoInvalido){
    this._connection.open(function(err, mongoclient){
        mongoclient.collection("jogo",
        function(erro, collection){
           // collection.find({usuario:{$eq:usuario.usuario}, senha:{$eq: usuario.senha}});
           //collection.find({usuario:usuario.usuario, senha: usuario.senha});
           collection.find({usuario:usuario}).toArray(function(err, result){
               res.render('jogo',{img_casa:casa, jogo: result[0], comandoInvalido:comandoInvalido});                                              
           });
           mongoclient.close();
        });
    }); 
}

module.exports = function(){
    return JogoDAO;
}