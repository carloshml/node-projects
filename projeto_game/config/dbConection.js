const { MongoClient } = require('mongodb');
const env = require('./env');

const options = {
  connectTimeoutMS: 120000,
  socketTimeoutMS: 1440000
};

class MongoDBConnection {
  getDB() {
    return mConnect();
  }
}

module.exports = new MongoDBConnection();

async function mConnect() {
  const client = await MongoClient.connect(env.mongoUri, options);
  const db = client.db(env.mongoDb);
  return { db, client };
}
