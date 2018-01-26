module.exports.formulario = function(application,req,res){
   res.render("admin/form_add_noticia",{validacao:{},noticia:{}});
}
module.exports.noticias_salvar = function(application,req,res){
  var noticia = req.body ;

  req.assert('titulo','Título é obrigatório').notEmpty();
  req.assert('resumo','Resumo é obrigatório').notEmpty();
  req.assert('autor','Resumo é obrigatório').notEmpty();
  req.assert('noticia','Notícia é obrigatória').notEmpty();
  req.assert('data_noticia','data é obrigatório').notEmpty();
  req.assert('resumo','Resumo [10,100]').len(10,100);
  var errors = req.validationErrors();
     if(errors){
       res.render("admin/form_add_noticia",{validacao:errors, noticia:noticia});
       return ;
     }

  // conexao

  var connection = app.config.db_connection();
  //model
  var noticiasModel = new app.app.models.NoticiasDao(connection);
  // enviar em uma função de salvar
  noticiasModel.salvarNoticia(noticia, function(error, resultado){

       res.redirect("/noticias");

    });

  // implentar uma função de calback para inserir as noticias

}
