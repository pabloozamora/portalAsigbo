import Express from 'express';
import indexRoutes from './routes/index.js';

const app = Express();

app.use('/', indexRoutes);

export default app;
