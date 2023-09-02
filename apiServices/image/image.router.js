import express from 'express';
import { getAreaImageController, getUserImageController } from './image.controller.js';

const imageRouter = express.Router();

imageRouter.get('/user/:id', getUserImageController);
imageRouter.get('/area/:id', getAreaImageController);

export default imageRouter;
