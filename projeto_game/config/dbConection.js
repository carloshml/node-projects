var MongoClient = require('mongodb').MongoClient;
const config = {
  user: '',
  password: '',
  url: 'localhost:27017',
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
    return  mConnect();
  }
}

module.exports = new MongoDBConnection();

// transforms into a promise Mongo's client.connect
function mConnect() {
  return new Promise((resolve, reject) => {     
    MongoClient
      .connect('mongodb://localhost',
        options,
        function (err, clientResponse) {
          if (err) {
            reject(err);
          }
          const db = clientResponse.db(config.database);
          const clienteAberto = clientResponse;         
          resolve({ db, client: clienteAberto });
        });
  });
}