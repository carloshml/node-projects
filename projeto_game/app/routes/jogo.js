module.exports = function(application){
	application.get('/jogo', function(req, res){
		application.app.controllers.jogo.render(application,req, res );		
	});

	application.get('/sair', function(req, res){
		application.app.controllers.jogo.sair(application,req, res );		
	});

	application.get('/gerarSuditos', function(req, res){
		application.app.controllers.jogo.gerarSuditos(application,req, res );		
	});

	application.get('/gerarPergaminhos', function(req, res){
		application.app.controllers.jogo.gerarPergaminhos(application,req, res );		
	});

	application.post('/gerarOrdemSuditos', function(req, res){
		application.app.controllers.jogo.gerarOrdemSuditos(application,req, res );		
	});

	application.get('/revogar_acao', function(req, res){
		application.app.controllers.jogo.revogarAcao(application,req, res );		
	});
}