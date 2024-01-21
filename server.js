const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Array para almacenar usuarios conectados.
let usuarios = [];

app.use(express.static('public'));

io.on('connection', (socket) => {
    // Añadir usuario
    socket.on('set username', (username) => {
        // Validar si el usuario introducido ya existía.
        const usuarioExistente = usuarioNombre(username);

        if (usuarioExistente) {
            // Si ya existe el usuario, mandar un mensaje notificándolo.
            socket.emit('Ese usuario ya está en uso.');
        } else {
            socket.username = username;

            // Añadir el usuario al array.
            const usuario = { socketId: socket.id, username: username };
            usuarios.push(usuario);
            io.emit('usuarios conectados', todosUsuarios());

            socket.emit('username valid');
        }
    });

    socket.on('chat message', (msg) => {
        // Emitir el mensaje solo a los usuarios conectados
        io.emit('chat message', { msg: msg, from: socket.username, to: null });
    });

    socket.on('private message', (data) => {
        const sender = usuarioID(socket.id);
        const recipient = usuarioNombre(data.to);

        if (sender && recipient) {
            socket.to(recipient.socketId).emit('private message', {
                msg: data.msg,
                from: sender.username,
                to: recipient.username
            });
            socket.emit('private message', {
                msg: data.msg,
                from: sender.username,
                to: recipient.username
            });
        }
    });

    socket.on('disconnect', () => {
        // Eliminar al usuario del registro cuando se desconecte
        eliminarUsuario(socket.id);

        // Notificar a todos los usuarios sobre el cambio en la lista de conectados
        io.emit('usuarios conectados', todosUsuarios());
    });
});



http.listen(3000, () => {
    console.log('Escuchando en el puerto 3000');
});

//Funciones
function usuarioID(socketId) {
    return usuarios.find(usuario => usuario.socketId === socketId);
}

function usuarioNombre(username) {
    return usuarios.find(usuario => usuario.username === username);
}

function todosUsuarios() {
    return usuarios.map(usuario => usuario.username);
}

function eliminarUsuario(socketId) {
    const index = usuarios.findIndex(usuario => usuario.socketId === socketId);
    if (index !== -1) {
        usuarios.splice(index, 1);
    }
}
