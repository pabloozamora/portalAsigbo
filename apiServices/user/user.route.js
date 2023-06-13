import express from 'express';
import { createUserController } from './user.controller.js';
import validateBody from '../../middlewares/validateBody.js';
import createUserSchema from './validationSchemas/createUserSchema.js';

const userRouter = express.Router();

userRouter.post('/', validateBody(createUserSchema), createUserController);

export default userRouter;
