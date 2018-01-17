
var express = require('express');
var app=express();

app.set('view engine','ejs');
//acessando do app.js para baixo
app.set('views','./app/views');

module.exports = app;
