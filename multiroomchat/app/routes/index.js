module.exports = function(appication){
    appication.get('/', function(req,res){   
      appication.app.controllers.index.home(appication,req,res);
    });
}
