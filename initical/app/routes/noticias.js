var dbConection = require('./../../config/db_connection')

module.exports = function(app){

  var connection = dbConection();

app.get('/noticias',function(req, res){


  connection.query('select * from noticias', function(error, resultado){
       res.render("noticias/noticias", {noticias: resultado });
  });



    });
}
