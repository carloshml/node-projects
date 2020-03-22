module.exports = function(application){
	application.get('/', function(req, res){
		application.app.controllers.index.render(application,req, res );		
	});

	application.post('/autenticar', function(req, res){
		application.app.controllers.index.autenticar(application,req, res );		
	});

	application.post('/update-usuario', function(req, res){
		application.app.controllers.index.atualizarUsuario(application,req, res );
	});

	application.get('/home', function(req, res){
		application.app.controllers.index.irParaHome(application,req, res );		
	});

	application.get('/usuarios', function(req, res){
		application.app.controllers.index.verUsuarios(application,req, res );		
	});
}