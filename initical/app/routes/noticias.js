module.exports = function(app){

app.get('/noticias',function(req, res){
  var mysql = require('mysql');

  var connection = mysql.createConnection({
    host: 'localhost',
    user:'root',
    password:'root',
    database:'portal_noticias'
  });

  connection.query('select * from noticias', function(error, resultado){
       res.render("noticias/noticias", {noticias: resultado });
  });



    });
}
