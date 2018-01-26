module.exports.noticias = function(application, req, res){
  var connection = application.config.db_connection() ;
  var noticiasModel = new application.app.models.NoticiasDao(connection);
  noticiasModel.getNoticias(function(error, resultado){

       res.render("noticias/noticias", {noticias: resultado });

    });
}

module.exports.noticia = function(application, req, res){
  var connection = application.config.db_connection();

  var noticiasModel =  new application.app.models.NoticiasDao(connection);
  noticiasModel.getNoticia( function(error, resultado){

       res.render("noticias/noticia", {noticias: resultado });

    });
}
