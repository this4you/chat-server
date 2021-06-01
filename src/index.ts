import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import morgan from 'morgan';
import createRoutes from './сore/routes';
import createSocket from './сore/socket';
import './сore/db';
dotenv.config();
const logger = morgan('dev');
const app = express();
const http = createServer(app);
const io = createSocket(http);
app.use(logger);
createRoutes(app, io);

http.listen(3003, () => {
    console.log("Server start ...");
});
