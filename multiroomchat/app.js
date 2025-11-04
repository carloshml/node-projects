const app = require('./config/server');
const port = 3000;

const server = app.listen(port, function () {
  console.log(`servidor está online use localhost:${port}`);
});

const io = require('socket.io')(server);
app.set('io', io);

// Import and initialize socket logic
require('./socketHandler')(io);