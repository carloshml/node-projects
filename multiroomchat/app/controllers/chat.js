const handler = require('../../socketHandler');

module.exports.iniciaChat = function (application, req, res, metodo) {
  var dadosForm = req.body;

  if (!req.body.apelido) {
    res.render('index', { erros: [{ msg: 'Apelido deve ser inserido' }] });
    return;
  }

  if (req.body.apelido && (req.body.apelido.length > 15 || req.body.apelido.length < 3)) {
    res.render('index', { erros: [{ msg: 'Apelido deve ter de 4 a 15 caracteres!' }] });
    return;
  }


  const apelidos = handler.apelidosParticipantes;
  handler.adicionarApelido(dadosForm.apelido);

  setTimeout(() => {
    application.get('io').emit('msgParaCliente', {
      apelido: dadosForm.apelido,
      mensagem: 'acabou de entrar no chat',
      apelidosParticipantes: apelidos
    });

    application.get('io').emit('participantesParaCliente', {
      apelido: dadosForm.apelido,
      apelidosParticipantes: apelidos
    });
  }, 1000);

  res.render('chat', { dadosForm: dadosForm });
}
