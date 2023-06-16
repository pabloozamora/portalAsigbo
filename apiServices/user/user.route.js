import express from 'express';
import { createUserController, getActiveUsersController } from './user.controller.js';
import validateBody from '../../middlewares/validateBody.js';
import createUserSchema from './validationSchemas/createUserSchema.js';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';

const userRouter = express.Router();

userRouter.post('/', ensureAdminAuth, validateBody(createUserSchema), createUserController);
userRouter.get('/', ensureAdminAuth, getActiveUsersController);

export default userRouter;
