module.exports = function(application){
	application.get('/cadastro', function(req, res){
		application.app.controllers.cadastro.render(application,req, res );
    });
    
    application.post('/cadastrar', function(req, res){
		application.app.controllers.cadastro.cadastar(application,req, res );
	});
}