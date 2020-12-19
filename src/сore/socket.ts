import http from 'http';
import {Socket} from "socket.io";

export default (http: http.Server) => {
    const io = require("socket.io")(http, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', function(socket: Socket) {
        console.log("Socket client connected...")
        socket.on('DIALOGS:JOIN', (dialogId: string) => {
            console.log(dialogId);
            // socket.dialogId = dialogId;
            // socket.join(dialogId);
        });
        socket.on('DIALOGS:TYPING', (obj: any) => {
            socket.broadcast.emit('DIALOGS:TYPING', obj);
        });
    });

    return io;
};