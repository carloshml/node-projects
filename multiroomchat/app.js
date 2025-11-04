/* importar as configurações do servidor */
var app = require('./config/server');

const port = 3000;
/*parametrizar a porta de escuta*/
var server = app.listen(port, function () {
  console.log(`servidor está online use localhost:${port}`);
});


var io = require('socket.io')(server);
/* criar a conexão por websocket*/

var apelidosParticipantes = [];
//assim a variável fica global
app.set('io', io);
// aqui é o lado do servidor o que é mandado aqui é
//mandado para todo mundo
io.on('connection', function (socket) {
  console.log('usuario conectou');

  socket.on('disconnect', function () {
    console.log('usuario desconectou');
  })

  socket.on('msgParaServidor', function (data) {

    if (!apelidosParticipantes.includes(data.apelido)) {
      apelidosParticipantes.push(data.apelido);
    }


    socket.emit('msgParaCliente',
      { apelido: data.apelido, mensagem: data.mensagem }
    );
    socket.broadcast.emit('msgParaCliente',
      { apelido: data.apelido, mensagem: data.mensagem }
    );

    socket.emit('participantesParaCliente',
      { apelidosParticipantes }
    );
    socket.broadcast.emit('participantesParaCliente',
      { apelidosParticipantes }
    );

  });
});
