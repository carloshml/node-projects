module.exports = function(){

  this.getNoticias = function(connection,callback){
    connection.query('select * from noticias',callback);
  };

  this.getNoticia = function(connection,callback){
    connection.query('select * from noticias where id=1',callback);
  };

  this.salvarNoticia = function(noticia, connection, callback){
    // o modo instalado suporta o json ele faz essa traducao
    connection.query('insert into noticias set ? ',noticia,callback);
  };

  return this;
}
