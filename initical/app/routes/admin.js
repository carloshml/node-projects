module.exports = function(app){
    app.get('/formulario',function(req, res){
       app.app.controllers.admin.formulario( app,req, res );
    });    
}
