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
            // @ts-ignore
            socket.dialogId = dialogId;
            socket.join(dialogId);
        });
        socket.on('DIALOGS:TYPING', (obj: any) => {
            socket.broadcast.emit('DIALOGS:TYPING', obj);
        });

        socket.on('join', (userId: string) => {
            console.log("User joined!", userId)
            socket.join(userId);
        });
    });

    return io;
};