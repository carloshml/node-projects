var app = require('./config/server') ;

app.listen(3000, function(){
var rotaNoticias = require('./app/routes/noticias')(app);
var rotaHome = require('./app/routes/home')(app);
var rotaFormulario = require('./app/routes/formulario_inclusao_noticia')(app);
  console.log('Servidor Rodando');
});
