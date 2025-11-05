const app = require('./config/server');
const port = 3000;

const server = app.listen(port, function () {
  console.log(`servidor está online use localhost:${port}`);
});

const io = require('socket.io')(server);
const handler = require('./socketHandler')(io);
app.set('io', io);
app.set('handler', handler);

// Import and initialize socket logic
