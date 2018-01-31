/* importar as configurações do servidor */
var app = require('./config/server');

/*parametrizar a porta de escuta*/
var server = app.listen(3000,function(){
    console.log('servidor está online use localhost:3000');
});


var io= require('socket.io').listen(server);
/* criar a conexão por websocket*/


//assim a variável fica global
app.set('io',io);
// aqui é o lado do servidor o que é mandado aqui é
//mandado para todo mundo
io.on('connection',function(socket){
      console.log('usuario conectou');

      socket.on('disconnect',function(){
        console.log('usuario desconectou');
      })

      socket.on('msgParaServidor', function(data){
          socket.emit('msgParaCliente',
            {apelido:data.apelido,mensagem: data.mensagem}
          );
          socket.broadcast.emit('msgParaCliente',
          {apelido:data.apelido,mensagem: data.mensagem}
        );
      });
});
