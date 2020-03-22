module.exports = function(appication){
    appication.post('/chat', function(req,res){
     appication.app.controllers.chat.iniciaChat(appication,req,res);
    });

    appication.get('/chat', function(req,res){
     appication.app.controllers.chat.iniciaChat(appication,req,res);
    });
}
