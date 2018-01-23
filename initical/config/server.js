var consign = require('consign');
var express = require('express');
var app=express();
var bodyParser = require('body-parser');

app.set('view engine','ejs');
//acessando do app.js para baixo
app.set('views','./app/views');
//por ele ser um midleware
app.use(bodyParser.urlencoded({extended:true}));
//consign reclonhece todos as rotos da pasta routes
//e coloca-as no app
consign()
       .include('app/routes')
       .then('config/db_connection.js')
       .then('app/models')
       .into(app);

module.exports = app;
