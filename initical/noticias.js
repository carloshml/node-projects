var http= require('http');

var server = http.createServer(function(requisicao,resposta){
    resposta.end("<html> "
                    +"<head><title>primeiro Arquivo</title></head>"
                    +"<body>portal notícias</body> "+
                    "</html>");
});

server.listen(3000);
