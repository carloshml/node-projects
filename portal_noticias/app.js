const app = require('./config/server');

const port = '3000';
app.listen(port, () => {
  const connection = app.config.db_connection();
  const noticiasModel = new app.app.models.NoticiasDao(connection);
  // enviar em uma função de salconst
  noticiasModel.criarDataBase({}, function (error, resultado) {
    if(!error){
      console.error('Tudo certo DataBase iniciada'); 
    }else{
      console.error('error criarDataBase',error);    
    }
  });
  console.log(`Servidor Rodando porta: ${port}`);
});
