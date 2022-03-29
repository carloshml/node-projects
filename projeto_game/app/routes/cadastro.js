module.exports = function(application){
	application.get('/cadastro', function(req, res){
		application.app.controllers.cadastro.render(application,req, res );
    });
    
    application.post('/inserirUsuario', function(req, res){
		application.app.controllers.usuario.inserirUsuario(application,req, res );
	});
}