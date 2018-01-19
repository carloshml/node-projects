//var dbConection = require('./../../config/db_connection')

module.exports = function(app){



app.get('/noticias',function(req, res){

  var connection = app.config.db_connection() ;
  connection.query('select * from noticias', function(error, resultado){
       res.render("noticias/noticias", {noticias: resultado });
  });



    });
}
