module.exports = function(application){
	application.get('/jogo', function(req, res){
		application.app.controllers.jogo.render(application,req, res );
		
	});

	application.get('/sair', function(req, res){
		application.app.controllers.jogo.sair(application,req, res );		
	});
}