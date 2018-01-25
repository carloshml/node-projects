//var dbConection = require('./../../config/db_connection')

module.exports = function(application){



application.get('/noticias',function(req, res){

  var connection = application.config.db_connection() ;
  var noticiasModel = new application.app.models.NoticiasDao(connection);
  noticiasModel.getNoticias(function(error, resultado){

       res.render("noticias/noticias", {noticias: resultado });

    });
});
}
