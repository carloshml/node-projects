let http = require('http');

const opcoes ={
    hostname:'localhost',
    port:8000,
    path:'/',
    method : 'post',
    headers:{
        'Accept': 'application/json',
        'Content-type':'application/json'
       //'Accept': 'text/html'
    }
}

var html = {nome:'José'};
var json =  JSON.stringify(html) ;

var buffer_corpo_response = [];

var req  = http.request(opcoes,function(res){
    // chunck
    res.on('data',function(pedaco){
        buffer_corpo_response.push(pedaco)
    });
    res.on('end',function(){
        var corpo_response = Buffer.concat(buffer_corpo_response).toString();
        console.log(corpo_response);
    });

    res.on('error',function(){

    });
});

req.write(json);
req.end();
