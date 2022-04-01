const { check, validationResult } = require('express-validator');
module.exports = function (application) {
	application.get('/jogo', function (req, res) {
		application.app.controllers.jogoController.iniciaJogo(application, req, res);
	});

	application.get('/sair', function (req, res) {
		application.app.controllers.jogoController.sair(application, req, res);
	});

	application.get('/gerarSuditos', function (req, res) {
		application.app.controllers.jogoController.gerarSuditos(application, req, res);
	});

	application.get('/gerarPergaminhos', function (req, res) {
		application.app.controllers.jogoController.gerarPergaminhos(application, req, res);
	});

	application.get('/atualizarAcoesDeJogo', function (req, res) {
		application.app.controllers.jogoController.atualizarAcoesDeJogo(application, req, res);
	});

	application.post('/gerarOrdemSuditos', [
		check('acao', 'acao deve ser informada').notEmpty(),
		check('quantidade', 'acao deve ser informada').notEmpty()
	], function (req, res) {
		application.app.controllers.jogoController.gerarOrdemSuditos(application, req, res, validationResult);
	});

	application.get('/revogar_acao', function (req, res) {
		application.app.controllers.jogoController.revogarAcao(application, req, res);
	});
}