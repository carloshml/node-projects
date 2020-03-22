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

  var id_noticia = req.query;
  noticiasModel.getNoticia( id_noticia,  function(error, resultado){

    console.log('---------------', error, resultado)

       res.render("noticias/noticia", {noticias: resultado });

    });
}
