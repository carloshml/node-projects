var mysql = require('mysql');

var connMysql = function(){

  console.log('A conexao foi estabelecida ');

  return mysql.createConnection({
    host: 'localhost',
    user:'root',
    password:'root',
    database:'portal_noticias'
  });
}

module.exports = function(){
  console.log('carregou módulo de conexão com banco de dados ');
  return connMysql;
}
