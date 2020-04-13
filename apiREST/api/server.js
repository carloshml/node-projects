/* importar as configurações do servidor */
var express = require('express'),
bodyParser = require('body-parser'),
mongodb = require('mongodb');

var app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

/* parametrizar a porta de escuta */
var porta =  8000
app.listen(8000, function(){
	console.log('Servidor rodando em localhost:'+porta);
})