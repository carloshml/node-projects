/* importação do Framework express*/
var express = require('express');

/*importação do modulo do consig*/
var consign = require('consign');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');

/* instanciando o objeto do express é o que vai ser passado para o entry point
 da aplicação
*/
var app = express();

app.set('view engine','ejs');
app.set('views', './app/views');

/* configurando o middleware espress.tatic*/
app.use(express.static('./app/public'));

/* configurar o middleware body-parser*/
app.use(bodyParser.urlencoded({ extended:true}));

/* configurar o express validator */
app.use(expressValidator());


/*efetua os autloads para o objeto app*/
consign()
.include('./app/routes')
.then('app/models')
.then('app/controllers')
.into(app);



/* exportando o anjeto do app*/
module.exports = app;
