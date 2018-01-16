var express = require('express');
var app=express();

app.set('view engine','ejs');
app.listen(3000, function(){


  app.get('/tecnologia',function(req, res){
    res.render("secao/tecnologia");
  });

  app.get('/formulario',function(req, res){
    res.render("admin/form_add_noticia");
  });

  app.get('/noticias',function(req, res){
    res.render("noticias/noticias");
  });

  app.get('/',function(req, res){
    res.render("home/index");
  });
  console.log('Servidor Rodando');
});
