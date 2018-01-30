/* importar as configurações do servidor */
var app = require('./config/server');

/*parametrizar a porta de escuta*/
var server = app.listen(3000,function(){
    console.log('servidor está online use localhost:3000');
});


var io= require('socket.io').listen(server);
/* criar a conexão por websocket*/

io.on('connection',function(socket){
      console.log('usuario conectou');

      socket.on('disconnect',function(){
        console.log('usuario desconectou');
      })
});
