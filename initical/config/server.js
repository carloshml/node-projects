var consign = require('consign');
var express = require('express');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');



//acessando do app.js para baixo
var app=express();

app.set('view engine','ejs');
app.set('views','app/views');
//por ele ser um midleware
app.use(express.static('./app/public'))
app.use(bodyParser.urlencoded({extended:true}));
app.use(expressValidator());
//consign reclonhece todos as rotos da pasta routes
//e coloca-as no app
consign()
       .include('app/routes')
       .then('config/db_connection.js')
       .then('app/models')
       .then('app/controllers')
       .into(app);

module.exports = app;
