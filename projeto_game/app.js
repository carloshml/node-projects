/* importar as configurações do servidor */
const http = require('http');
const { Server } = require('socket.io');
const app = require('./config/server');
const iniciarChat = require('./app/chat/chatServer');

/* criar o servidor HTTP e acoplar o Socket.IO */
const server = http.createServer(app);
const io = new Server(server);

/* compartilhar a sessão do Express com o Socket.IO */
if (app.sessionMiddleware) {
	io.engine.use(app.sessionMiddleware);
}

iniciarChat(io);

/* parametrizar a porta de escuta */
server.listen(8200, function () {
	console.log('Servidor online');
	console.log('Servidor rodando em localhost:8200');
});
