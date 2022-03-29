module.exports = function(application){
	application.get('/', function(req, res){
		application.app.controllers.index.render(application,req, res );		
	});

	application.get('/home', function(req, res){
		application.app.controllers.index.irParaHome(application,req, res );		
	});

	application.post('/autenticar', function(req, res){
		application.app.controllers.usuario.autenticar(application,req, res );		
	});

	application.post('/update-usuario', function(req, res){
		application.app.controllers.usuario.atualizarUsuario(application,req, res );
	});

	application.get('/buscarUsuarios', function(req, res){
		application.app.controllers.usuario.buscarUsuarios(application,req, res );		
	});

	application.get('/buscaJogoUsuario', function(req, res){
		application.app.controllers.usuario.buscaJogoUsuario(application,req, res );		
	});
}