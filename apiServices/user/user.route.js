import express from 'express';
import {
  createUserController, getActiveUsersController, getLoggedUserController, getUserController,
} from './user.controller.js';
import validateBody from '../../middlewares/validateBody.js';
import createUserSchema from './validationSchemas/createUserSchema.js';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';
import ensureRefreshTokenAuth from '../../middlewares/ensureRefreshTokenAuth.js';

const userRouter = express.Router();

userRouter.post('/', ensureAdminAuth, validateBody(createUserSchema), createUserController);
userRouter.get('/', ensureAdminAuth, getActiveUsersController);
userRouter.get('/logged', ensureRefreshTokenAuth, getLoggedUserController);
userRouter.get('/user', ensureAdminAuth, getUserController);

export default userRouter;
