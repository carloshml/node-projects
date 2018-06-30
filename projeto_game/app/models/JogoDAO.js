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

JogoDAO.prototype.iniciaJogo = function( res, usuario, casa, msg){
    this._connection.open(function(err, mongoclient){
        mongoclient.collection("jogo",
        function(erro, collection){
           // collection.find({usuario:{$eq:usuario.usuario}, senha:{$eq: usuario.senha}});
           //collection.find({usuario:usuario.usuario, senha: usuario.senha});
           collection.find({usuario:usuario}).toArray(function(err, result){
               res.render('jogo',{img_casa:casa, jogo: result[0], msg:msg});                                              
           });
           mongoclient.close();
        });
    }); 
}

JogoDAO.prototype.acao = function(acao){
    this._connection.open(function(err, mongoclient){
        mongoclient.collection("acao",
        function(erro, collection){            
            let acao_termina_em = new Date().getTime();
            
            switch (acao.acao) {
                case 1: acao_termina_em + 60*60000 ;                  
                    break;
                case 2: acao_termina_em + 2* 60*60000   ;                
                    break;
                case 3: acao_termina_em + 5* 60*60000   ;                    
                    break;
                case 4: acao_termina_em + 5*  60*60000   ;                  
                    break;            
                default: console.log("error");
                    break;
            }

            acao.acao_termina_em = acao_termina_em;
            console.log(acao);

            collection.insert(
                acao
            ); 
            mongoclient.close();
        });
    }); 
}

module.exports = function(){
    return JogoDAO;
}