//var dbConection = require('./../../config/db_connection')

module.exports = function (application) {
      application.get('/noticia', function (req, res) {
            application.app.controllers.noticias.noticia(application, req, res);
      });
      application.get('/noticias', function (req, res) {
            application.app.controllers.noticias.noticias(application, req, res);
      });

      app.post('/noticias/salvar', function (req, res) {
            app.app.controllers.admin.noticias_salvar(app, req, res);
      });
}
