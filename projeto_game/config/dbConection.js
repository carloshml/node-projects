const mongodb = require('mongodb');
 
const client  = mongodb.MongoClient;
const config = {
    user:'',
    password:'',
    url:'localhost:27017',
    database:'got',

}
// const mongodbUri = `mongodb://${config.user}:${config.password}@${config.url}/${config.database}`;
const mongodbUri = `mongodb://${config.url}/${config.database}`;


const options = {
  poolSize: 100, 
  connectTimeoutMS: 120000, 
  socketTimeoutMS: 1440000
 };

// connection object
let _db = null;

class MongoDBConnection {
  constructor() {}

  // return a promise to the existing connection or the connection function
  getDB() {
    return (_db ? Promise.resolve(_db) : mConnect());
  }
}

module.exports = new MongoDBConnection();

// transforms into a promise Mongo's client.connect
function mConnect() {
  return new Promise((resolve, reject) => {
    console.log('Connecting to Mongo...');
    client.connect(mongodbUri, options, (error, db) => {
      if (error)  {
        _db = null;
        return reject(error);
      }
      else {
        console.log('Connected to Mongo...');
        _db = db;
        resolve(db);
      }
    });
  });
}