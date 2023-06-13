import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import indexRoutes from './routes/index.js';
import connect from './db/connection.js';
import getDirname from './utils/getDirname.js';

const app = express();

global.dirname = getDirname(import.meta.url);

await connect();

app.use(cors());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/', indexRoutes);

export default app;
