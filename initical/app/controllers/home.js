module.exports.index = function(application, req, res){

  var connection = application.config.db_connection() ;
  var noticiasModel = new application.app.models.NoticiasDao(connection);
  //regra de negocio
  noticiasModel.get5ultimasNoticias(function(error,result){

    console.log(result);
    res.render("home/index",{noticias:result});

  });

}
