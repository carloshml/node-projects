//var dbConection = require('./../../config/db_connection')

module.exports = function(app){



app.get('/noticia',function(req, res){

  var connection = app.config.db_connection() ;
  connection.query('select * from noticias where id =1', function(error, resultado){
       res.render("noticias/noticia", {noticias: resultado });
  });



    });
}
