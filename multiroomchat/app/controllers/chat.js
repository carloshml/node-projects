module.exports.iniciaChat = function(application,req,res){
  /*manda informação
       res.send('test')
  */
  var dadosForm = req.body;
  console.log(req.body);

  req.assert('apelido','Nome é obrigatório').notEmpty();
  req.assert('apelido','Nome entre 3-15').len(3,15);

  var errors = req.validationErrors();

  if(errors){
    res.render('index',{erros:errors});
    return;
  }
     application.get('io')
     .emit('msgParaCliente',
            {apelido: dadosForm.apelido,
             mensagem:'acabou de entrar no chat'}
   );



     res.render('chat',{dadosForm: dadosForm});
}
