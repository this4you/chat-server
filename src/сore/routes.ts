import express from 'express';
import bodyParser from "body-parser";
import socket from "socket.io";
import {checkAuth, updateLastSeen} from "../middleware";
import {DialogController, MessageController, UserController} from "../controllers";
import {loginValidation, registerValidation} from "../utils/validations";

export default  (app: express.Express, io: socket.Server) => {
    const User = new UserController(io);
    const Dialog = new DialogController(io);
    const Message = new MessageController(io);

    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());
    app.use(checkAuth);
    app.use(updateLastSeen);


    app.get('/user/me', User.getMe);
    app.get("/user/find", User.findUsers);
    app.get("/user/verify", User.verify);
    app.get('/user/:id', User.show);
    app.get('/users', User.showAll);
    app.delete('/user/:id', User.delete);
    app.post("/user/signup", registerValidation, User.create);
    app.post("/user/signin", loginValidation, User.auth);

    app.get('/dialogs', Dialog.index);
    app.post('/dialogs', Dialog.create);
    app.delete('/dialog/:id', Dialog.delete);

    app.get('/messages', Message.index);
    app.post('/messages', Message.create);
    app.delete('/messages', Message.delete);
}