import express from 'express';
import { getUserImageController } from './image.controller.js';

const imageRouter = express.Router();

imageRouter.get('/user/:id', getUserImageController);

export default imageRouter;
