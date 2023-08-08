const { check, validationResult } = require('express-validator');
module.exports = function (appication) {
    appication.post('/chat', function (req, res, validationResult) {
        appication.app.controllers.chat.iniciaChat(appication, req, res, 'post');
    });

    appication.get('/chat', function (req, res, validationResult) {
        appication.app.controllers.chat.iniciaChat(appication, req, res, 'get');
    });
}
