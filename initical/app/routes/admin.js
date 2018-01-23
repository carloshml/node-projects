module.exports = function(app){
    app.get('/formulario',function(req, res){
      res.render("admin/form_add_noticia");
    });

    app.post('/noticias/salvar',function(req, res){
      var noticia = req.body ;

      console.log(noticia);
      // conexao

      var connection = app.config.db_connection();
      //model
      var noticiasModel = app.app.models.noticiasModel;
      // enviar em uma função de salvar
      noticiasModel.salvarNoticia(noticia, connection, function(error, resultado){

           res.redirect("/noticias");

        });

      // implentar uma função de calback para inserir as noticias
    });
}
