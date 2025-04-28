const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let clients = {};

io.on('connection', (socket) => {
    clients[socket.id] = { position: { x: 0, y: 0, z: 0 } };

    socket.on('updatePosition', (position) => {
        clients[socket.id].position = position;
        io.emit('clientsUpdate', clients);
    });

    socket.on('disconnect', () => {
        delete clients[socket.id];
        io.emit('clientsUpdate', clients);
    });
});

// Itt indítjuk el a szervert
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
