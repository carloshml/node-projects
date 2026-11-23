/* importar o módulo do framework express */
var express = require('express');

/* importar o módulo do consign */
var consign = require('consign');

/* importar o módulo do express-session */
var expressSession = require('express-session');
var MongoStore = require('connect-mongo').MongoStore;

/* carregar e validar as variáveis de ambiente */
var env = require('./env');

/* iniciar o objeto do express */
var app = express();

/* setar as variáveis 'view engine' e 'views' do express */
app.set('view engine', 'ejs');
app.set('views', './app/views');

/* configurar o middleware express.static */
app.use(express.static('./app/public')); 

/* configurar os parsers nativos do Express 5 */
app.use(express.urlencoded({extended: true}));
app.use(express.json());

/* configurar o middleware express-session */
const sessionStore = MongoStore.create({
	mongoUrl: env.mongoUri,
	dbName: env.mongoDb,
	collectionName: 'sessoes',
	ttl: Math.floor(env.sessionMaxAge / 1000),
	autoRemove: 'native',
	touchAfter: 24 * 60 * 60
});

const sessionMiddleware = expressSession({
	secret: env.sessionSecret,
	name: env.sessionName,
	resave: false, // pois não será regravada a cada sessão
	saveUninitialized: false,
	store: sessionStore,
	cookie: {
		httpOnly: true,
		sameSite: 'lax',
		secure: env.secureCookie,
		maxAge: env.sessionMaxAge
	}
});
app.use(sessionMiddleware);


/* efetua o autoload das rotas, dos models e dos controllers para o objeto app */
consign()
	.include('app/routes')
	.then('config/dbConection.js')
	.then('app/models')
	.then('app/controllers')
	.into(app);

/* exportar o objeto app */
module.exports = app;
module.exports.sessionMiddleware = sessionMiddleware;