let http = require('http');

const opcoes ={
    hostname:'localhost',
    port:8000,
    path:'/',
    headers:{
        'Accept': 'application/json'
       //'Accept': 'text/html'
    }
}

http.get(opcoes,function(res){
    // chunck
    res.on('data',function(pedaco){
        console.log(''+pedaco);
    });
    res.on('end',function(){

    });
    res.on('error',function(){

    });
});
