/* importar o módulo do framework express */
var express = require('express');

/* importar o módulo do consign */
var consign = require('consign');

/* importar o módulo do body-parser */
var bodyParser = require('body-parser');

/* importar o módulo do express-session */
var expressSession = require('express-session');

/* iniciar o objeto do express */
var app = express();

/* setar as variáveis 'view engine' e 'views' do express */
app.set('view engine', 'ejs');
app.set('views', './app/views');

/* configurar o middleware express.static */
app.use(express.static('./app/public')); 

/* configurar o middleware body-parser */
app.use(bodyParser.urlencoded({extended: true}));

/* configurar o middleware express-session */
app.use(expressSession({
	secret:'secretkey-00045',
	resave: false, // pois não será regravada a cada sessão
	saveUninitialized: false
}));


/* efetua o autoload das rotas, dos models e dos controllers para o objeto app */
consign()
	.include('app/routes')
	.then('config/dbConection.js')
	.then('app/models')
	.then('app/controllers')
	.into(app);

/* exportar o objeto app */
module.exports = app;