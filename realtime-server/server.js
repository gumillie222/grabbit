const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  const room = socket.handshake.query.room || 'default';
  socket.join(room);

  socket.on('update', (payload) => {
    io.to(room).emit('update', { ...payload, serverTs: Date.now() });
  });

  socket.on('ping', (clientTs) => {
    socket.emit('pong', { clientTs, serverTs: Date.now() });
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Realtime server running on port ${PORT}`));