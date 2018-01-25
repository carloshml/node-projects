//var dbConection = require('./../../config/db_connection')

module.exports = function(app){



app.get('/noticia',function(req, res){

  var connection = app.config.db_connection();

  var noticiasModel =  new app.app.models.NoticiasDao(connection);
  noticiasModel.getNoticia( function(error, resultado){

       res.render("noticias/noticia", {noticias: resultado });

    });



    });
}
