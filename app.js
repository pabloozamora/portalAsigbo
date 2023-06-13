import Express from 'express';
import indexRoutes from './routes/index.js';
import connect from './db/connection.js';

const app = Express();

await connect();

app.use('/', indexRoutes);

export default app;
