/* importar as configurações do servidor */
var express = require('express'),
bodyParser = require('body-parser');


var mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1/instagram', {useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	 console.log(' o banco tá aberto '); 
	});

var app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
/* var db = new mongodb.Db(
	'instagram',
	new mongodb.Server('127.0.0.1',27017,{}),
	{}
); */

/* parametrizar a porta de escuta */
var porta =  8000
app.listen(8000, function(){
	console.log('Servidor rodando em localhost:'+porta);
})

app.get('/',function(req, resp){
	resp.send({msg:'olá'});
});


app.post('/api',function(req, resp){
	var dados = req.body;   

    db.collection('postagens',function(error,collection){
		collection.insert(dados,function(error,records){
			if(error){
				resp.json(error);
			}else{
				resp.json(records);
			}

			mongocliente.close();
		});
	});

});