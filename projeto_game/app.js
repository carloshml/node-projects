/* importar as configurações do servidor */
var app = require('./config/server');

/* parametrizar a porta de escuta */
app.listen(8200, function(){
	console.log('Servidor online');
	console.log('Servidor rodando em localhost:8200');
})