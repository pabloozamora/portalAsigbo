import express from 'express';
import { getActivityImageController, getAreaImageController, getUserImageController } from './image.controller.js';

const imageRouter = express.Router();

imageRouter.get('/user/:id', getUserImageController);
imageRouter.get('/area/:id', getAreaImageController);
imageRouter.get('/activity/:id', getActivityImageController);

export default imageRouter;
