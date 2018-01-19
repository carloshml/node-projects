var consign = require('consign');
var express = require('express');
var app=express();

app.set('view engine','ejs');
//acessando do app.js para baixo
app.set('views','./app/views');

//consign reclonhece todos as rotos da pasta routes
//e coloca-as no app
consign()
       .include('./app/routes')
       .then('config/db_connection.js')
       .into(app);

module.exports = app;
