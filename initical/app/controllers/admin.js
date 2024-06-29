module.exports.formulario = function (application, req, res) {
  res.render("admin/form_add_noticia", { validacao: {}, noticia: {} });
}

module.exports.noticias_salvar = function (app, req, res) {
  var noticia = req.body;

  console.log(' noticia :::: ', noticia);

  const memsagens = [];

  !noticia.titulo ? memsagens.push({ msg: 'Título é obrigatório' }) : '';
  !noticia.resumo ? memsagens.push({ msg: 'Resumo é obrigatório' }) : '';
  !noticia.autor ? memsagens.push({ msg: 'Resumo é obrigatório' }) : '';
  !noticia.noticia ? memsagens.push({ msg: 'Notícia é obrigatória' }) : '';
  !noticia.data_noticia ? memsagens.push({ msg: 'Data é obrigatória' }) : '';
  noticia.resumo && noticia.resumo.legth < 100 ? memsagens.push({ msg: 'Resumo é obrigatória' }) : '';
  if (memsagens.length > 0) {
    console.log(' memsagens :::: ', memsagens);
    res.render("admin/form_add_noticia", { validacao: memsagens, noticia: noticia });
    return;
  }

  // conexao

  var connection = app.config.db_connection();
  //model
  var noticiasModel = new app.app.models.NoticiasDao(connection);
  // enviar em uma função de salvar
  noticiasModel.salvarNoticia(noticia, function (error, resultado) {
    if(!error){
      res.redirect("/noticias");
    }else{
      console.error('error salvarNoticia',error);
      res.render("admin/form_add_noticia", { validacao: memsagens, noticia: noticia });
    }
  });

  // implentar uma função de calback para inserir as noticias

}
