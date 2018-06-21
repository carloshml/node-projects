module.exports.render = function(application, req, res){
    res.render('cadastro',{validacao:{}, dadosForm: {}});
}

module.exports.cadastar = function(application, req, res){
    var dadosForm = req.body;

    req.assert('nome','nome não pode ser vazio').notEmpty();
    req.assert('usuario','usuário não pode ser vazio').notEmpty();
    req.assert('senha','senha não pode ser vazio').notEmpty();
    req.assert('casa','casa não pode ser vazio').notEmpty();

    var errors = req.validationErrors();

    if(errors){
        res.render('cadastro',{validacao:errors, dadosForm: dadosForm});
        console.log(errors);
        return;
    }

    res.send('tudo certo');
}