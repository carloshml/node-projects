function NoticiasDao(connection) {
  this._connection = connection;
}

NoticiasDao.prototype.getNoticias = function (callback) {
  this._connection.query('select * from noticias order by data_noticia desc ', callback);
};

NoticiasDao.prototype.getNoticia = function (id_noticia, callback) {
  console.log(id_noticia);
  this._connection.query('select * from noticias where id=' + id_noticia.id_noticia, callback);
};

NoticiasDao.prototype.salvarNoticia = function (noticia, callback) {
  // o modo instalado suporta o json ele faz essa traducao
  var dataNoticia = new Date(noticia.data_noticia);
  noticia.data_noticia = dataNoticia;
  dataNoticia = new Date();
  noticia.data_noticia.setHours(dataNoticia.getHours());
  noticia.data_noticia.setMinutes(dataNoticia.getMinutes());
  console.log(' save noticia:', noticia);
  try {
    this._connection.query('insert into noticias set ? ', noticia, callback);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

NoticiasDao.prototype.get5ultimasNoticias = function (callback) {
  // o modo instalado suporta o json ele faz essa traducao
  // recebe uma sql e uma callback
  this._connection.query('select * from noticias  order by data_noticia desc limit 5 ', callback);
};

NoticiasDao.prototype.criarDataBase = function (callback) {
  // criarDataBase
  this._connection.query(`
    CREATE TABLE IF NOT EXISTS noticias (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  titulo VARCHAR(255) NOT NULL,
                  resumo TEXT,
                  autor VARCHAR(255),
                  data_noticia DATETIME,
                  noticia TEXT
                );`,
    callback);
};



module.exports = function () {

  return NoticiasDao;
}



// module.exports = function(){
//
//   this.getNoticias = function(connection,callback){
//     connection.query('select * from noticias',callback);
//   };
//
//   this.getNoticia = function(connection,callback){
//     connection.query('select * from noticias where id=1',callback);
//   };
//
//   this.salvarNoticia = function(noticia, connection, callback){
//     // o modo instalado suporta o json ele faz essa traducao
//     connection.query('insert into noticias set ? ',noticia,callback);
//   };
//
//   return this;
// }
