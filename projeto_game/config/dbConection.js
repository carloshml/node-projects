const { MongoClient } = require('mongodb');

const config = {
  user: '',
  password: '',
  url: '127.0.0.1:27017',
  database: 'got'
};

// const mongodbUri = `mongodb://${config.user}:${config.password}@${config.url}/${config.database}`;
const mongodbUri = `mongodb://${config.url}/${config.database}`;

const options = {
  connectTimeoutMS: 120000,
  socketTimeoutMS: 1440000
};

class MongoDBConnection {
  constructor() { }

  // devolve uma Promise com a conexão aberta
  getDB() {
    try {
      return mConnect();
    } catch (error) {
      throw (error);
    }
  }
}

module.exports = new MongoDBConnection();

// transforma a conexão do driver em uma Promise
async function mConnect() {
  const client = await MongoClient.connect(mongodbUri, options);
  const db = client.db(config.database);
  return { db, client };
}
