import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';

import createRoutes from './сore/routes';
import createSocket from './сore/socket';
import './сore/db';
dotenv.config();

const app = express();
const http = createServer(app);
const io = createSocket(http);

createRoutes(app, io);

http.listen(3000, () => {
    console.log("Server start!");
});