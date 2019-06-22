let ObjectID = require('mongodb').ObjectID;

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

JogoDAO.prototype.iniciaJogo = function( res, req, casa, msg){
    const usuarioId = req.session._id;
    this._connection.open(function(err, mongoclient){
        mongoclient.collection("jogo",
        function(erro, collection){
           // collection.find({usuario:{$eq:usuario.usuario}, senha:{$eq: usuario.senha}});
           //collection.find({usuario:usuario.usuario, senha: usuario.senha});
           collection.find({usuario: ObjectID(usuarioId)}).toArray(function(err, result){             
             result[0].nome = req.session.nome;
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
            
            switch ( parseInt(acao.acao) ) {
                case 1: acao_termina_em = acao_termina_em + 60*60000 ;                  
                    break;
                case 2: acao_termina_em =  acao_termina_em + 2* 60*60000   ;                
                    break;
                case 3: acao_termina_em =  acao_termina_em + 5* 60*60000   ;                    
                    break;
                case 4: acao_termina_em =  acao_termina_em + 5*  60*60000   ;                  
                    break;            
                default: console.log("error");
                    break;
            }

            acao.acao_termina_em = acao_termina_em;

            collection.insert(
                acao
            );           
        });

        mongoclient.collection("jogo", function(erro, collection){  

            let moedas = null; 

            switch ( parseInt(acao.acao) ) {
                case 1: moedas = -2 *  acao.quantidade ;                  
                    break;
                case 2: moedas =  -3 * acao.quantidade  ;                
                    break;
                case 3: moedas =  -1 * acao.quantidade  ;                    
                    break;
                case 4: moedas =  -1  * acao.quantidade ;                  
                    break;            
                default: console.log("error");
                    break;
            }
            
            collection.update({ usuario: acao.usuario},
                             // { $set:{moeda:moedas} },
                              { $inc: {moeda:moedas} },
                             // {} como é apenas uma conexao esse permanece falso
                            );
              mongoclient.close();
        });       
    }); 
}

JogoDAO.prototype.getAcoes = function(usuario, res){

    
    this._connection.open(function(err, mongoclient){
        mongoclient.collection("acao",
        function(erro, collection){
           const momento_atual = new Date().getTime(); 
           collection.find({usuario:usuario, acao_termina_em : {$gt : momento_atual} }).toArray(function(err, result){        
            res. render('pergaminhos',{ acoes: result} );   
           });
           mongoclient.close();
        });
    }); 
}

JogoDAO.prototype.revogarAcao = function(idAcao, res){

    this._connection.open(function(err, mongoclient){
        mongoclient.collection("acao",
        function(erro, collection){            
            collection.remove(
                {_id: ObjectID(idAcao) },
                function(err, result){
                    res.redirect('jogo?msg=Deleted');
                    mongoclient.close();
                }
            );   
        });
    }); 
}
module.exports = function(){
    return JogoDAO;
}