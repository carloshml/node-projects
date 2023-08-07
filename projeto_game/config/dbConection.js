var MongoClient = require('mongodb').MongoClient;
const config = {
  user: '',
  password: '',
  url: '127.0.0.1:27017',
  database: 'got'
}
// const mongodbUri = `mongodb://${config.user}:${config.password}@${config.url}/${config.database}`;
const mongodbUri = `mongodb://${config.url}/${config.database}`;


const options = {
  connectTimeoutMS: 120000,
  socketTimeoutMS: 1440000
};

class MongoDBConnection {
  constructor() { }

  // return a promise to the existing connection or the connection function
  getDB() {
    try {
      return mConnect();
    } catch (error) {
      throw (error);
    }
  }
}

module.exports = new MongoDBConnection();

// transforms into a promise Mongo's client.connect
function mConnect() {
  return new Promise((resolve, reject) => {
   
    MongoClient
      .connect(mongodbUri,
        options,
        function (err, clientResponse) {
          if (err) {
            reject(err);
          }

          if (clientResponse && clientResponse.db) {
          const db = clientResponse.db(config.database);
          const clienteAberto = clientResponse;
          resolve({ db, client: clienteAberto });
          } else {
            reject('Sem conexão com o banco');
          }
        });
  });
}