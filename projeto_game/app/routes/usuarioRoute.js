const { check, validationResult } = require('express-validator');
module.exports = function (application) {
	application
		.get('/cadastro', function (req, res) {
			application.app.controllers.usuarioController.render(application, req, res);
		});

	application
		.post('/inserirUsuario',
			[
				check('nome', 'nome não pode ser vazio').notEmpty(),
				check('usuario', 'usuário não pode ser vazio').notEmpty(),
				check('senha', 'senha não pode ser vazio').notEmpty(),
				check('casa', 'casa não pode ser vazio').notEmpty(),
			],
			function (req, res) {
				application.app.controllers.usuarioController.inserirUsuario(application, req, res, validationResult);
			});

	application
		.post('/inserirUsuarioCrud',
			[
				check('nome', 'nome não pode ser vazio').notEmpty(),
				check('usuario', 'usuário não pode ser vazio').notEmpty(),
				check('senha', 'senha não pode ser vazio').notEmpty(),
				check('casa', 'casa não pode ser vazio').notEmpty(),
			],
			function (req, res) {
				application.app.controllers.usuarioController.inserirUsuarioCrud(application, req, res, validationResult);
			});

	application
		.post('/autenticar', [
			check('usuario', 'Usuário deve ser fornecido!').notEmpty(),
			check('senha', 'Senha deve ser fornecida!').notEmpty()
		], function (req, res) {
			application.app.controllers.usuarioController.autenticar(application, req, res, validationResult);
		});

	application
		.post('/atualizarUsuario', [
			check('nome', 'nome não pode ser vazio').notEmpty(),
			check('usuario', 'usuário não pode ser vazio').notEmpty()
		], function (req, res) {
			application.app.controllers.usuarioController.atualizarUsuario(application, req, res, validationResult);
		});

	application
		.get('/buscarUsuarios', function (req, res) {
			application.app.controllers.usuarioController.buscarUsuarios(application, req, res);
		});

	application
		.get('/buscaJogoUsuario', function (req, res) {
			application.app.controllers.usuarioController.buscaJogoUsuario(application, req, res);
		});

	application
		.get('/verRanking', function (req, res) {
			application.app.controllers.usuarioController.verRanking(application, req, res);
		});
}