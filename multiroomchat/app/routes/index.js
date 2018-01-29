module.exports = function(appication){
    appication.get('/', function(req,res){
      /*manda informação
           res.send('test')
      */
      appication.app.controllers.index.home(appication,req,res);
    });
}
