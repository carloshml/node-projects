module.exports = function(application){
	application.get('/', function(req, res){
		application.app.controllers.index.render(application,req, res );		
	});

	application.get('/home', function(req, res){
		application.app.controllers.index.irParaHome(application,req, res );		
	});
}