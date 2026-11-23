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
				check('senha', 'senha não pode ser vazia').notEmpty(),
				check('casa', 'casa não pode ser vazia').notEmpty(),
			],
			function (req, res) {
				application.app.controllers.usuarioController.inserirUsuario(application, req, res, validationResult);
			});

	application
		.post('/inserirUsuarioCrud',
			[
				check('nome', 'nome não pode ser vazio').notEmpty(),
				check('usuario', 'usuário não pode ser vazio').notEmpty(),
				check('senha', 'senha não pode ser vazia').notEmpty(),
				check('casa', 'casa não pode ser vazia').notEmpty(),
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
			check('usuario', 'usuário não pode ser vazio').notEmpty(),
			check('papel', 'perfil inválido').isIn(['jogador', 'admin'])
		], function (req, res) {
			application.app.controllers.usuarioController.atualizarUsuario(application, req, res, validationResult);
		});

	application
		.post('/resetarSenhaUsuario', [
			check('_id', 'usuário inválido').isMongoId()
		], function (req, res) {
			application.app.controllers.usuarioController.resetarSenhaUsuario(application, req, res, validationResult);
		});

	application
		.get('/trocarSenha', function (req, res) {
			application.app.controllers.usuarioController.renderTrocarSenha(application, req, res);
		});

	application
		.post('/trocarSenha', [
			check('senha', 'A nova senha deve ter pelo menos 8 caracteres').isLength({ min: 8 }),
			check('confirmarSenha', 'As senhas não conferem').custom(function (valor, { req }) {
				return valor === req.body.senha;
			})
		], function (req, res) {
			application.app.controllers.usuarioController.trocarSenha(application, req, res, validationResult);
		});

	application
		.get('/buscarUsuarios', function (req, res) {
			application.app.controllers.usuarioController.buscarUsuarios(application, req, res);
		});



	application
		.get('/verRanking', function (req, res) {
			application.app.controllers.usuarioController.verRanking(application, req, res);
		});
}