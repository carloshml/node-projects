const mysql = require('mysql2');

var connMysql = function () {  
  let connection;
  try {
    connection = mysql.createConnection({
      host: 'localhost',
      user: 'admin',
      port:'3306',
      password: '1234',
      database: 'portal_noticias'
    });
    console.log('A conexao foi estabelecida ');
  } catch (error) {
    console.error(error);
  }
  return connection;
}

module.exports = function () {
  console.log('carregou módulo de conexão com banco de dados ');
  return connMysql;
}
