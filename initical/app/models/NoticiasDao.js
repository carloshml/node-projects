function NoticiasDao(connection){
  this._connection = connection;

}

NoticiasDao.prototype.getNoticias = function(callback){
  this._connection.query('select * from noticias',callback);
};

NoticiasDao.prototype.getNoticia = function(id_noticia,callback){
  console.log(id_noticia);
  this._connection.query('select * from noticias where id='+id_noticia.id_noticia,callback);
};

NoticiasDao.prototype.salvarNoticia = function(noticia, callback){
  // o modo instalado suporta o json ele faz essa traducao
  this._connection.query('insert into noticias set ? ',noticia,callback);
};
NoticiasDao.prototype.get5ultimasNoticias = function( callback){
  // o modo instalado suporta o json ele faz essa traducao
  // recebe uma sql e uma callback
  this._connection.query('select * from noticias  order by data_criacao desc limit 5 ',callback);
};



module.exports = function(){

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
