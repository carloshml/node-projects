module.exports.iniciaChat = function (application, req, res, metodo) {
  var dadosForm = req.body;
  console.log('req.body::::', req.body);
  if (!req.body.apelido) {
    res.render('index', { erros: [{ msg: 'Apelido deve ser inserido' }] });
    return;
  }

  if (req.body.apelido && (req.body.apelido.length > 15 || req.body.apelido.length < 3)) {
    res.render('index', { erros: [{ msg: 'Apelido deve ter de 4 a 15 caracteres!' }] });
    return;
  }

  application
    .get('io')
    .emit('msgParaCliente',
      {
        apelido: dadosForm.apelido,
        mensagem: 'acabou de entrar no chat'
      }
    );
  res.render('chat', { dadosForm: dadosForm });
}
