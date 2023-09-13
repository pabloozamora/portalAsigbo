import express from 'express';
import {
  assignAdminRoleController,
  createUserController,
  finishRegistrationController,
  getUsersListController,
  getAdminUsersController,
  getLoggedUserController,
  getUserController,
  removeAdminRoleController,
  validateRegisterTokenController,
  disableUserController,
  enableUserController,
  deleteUserController,
} from './user.controller.js';
import validateBody from '../../middlewares/validateBody.js';
import createUserSchema from './validationSchemas/createUserSchema.js';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';
import ensureRefreshTokenAuth from '../../middlewares/ensureRefreshTokenAuth.js';
import ensureRegisterAuth from '../../middlewares/ensureRegisterAuth.js';
import multerMiddleware from '../../middlewares/multerMiddleware.js';
import uploadImage from '../../services/uploadFiles/uploadImage.js';
import finishRegistrationSchema from './validationSchemas/finishRegistrationSchema.js';

const userRouter = express.Router();

userRouter.post('/', ensureAdminAuth, validateBody(createUserSchema), createUserController);
userRouter.post(
  '/finishRegistration',
  ensureRegisterAuth,
  multerMiddleware(uploadImage.single('photo')),
  validateBody(finishRegistrationSchema),
  finishRegistrationController,
);
userRouter.get('/', ensureAdminAuth, getUsersListController);
userRouter.get('/admin', ensureAdminAuth, getAdminUsersController);
userRouter.get('/logged', ensureRefreshTokenAuth, getLoggedUserController);
userRouter.get('/validateRegisterToken', ensureRegisterAuth, validateRegisterTokenController);
userRouter.get('/:idUser', ensureAdminAuth, getUserController);
userRouter.patch('/:idUser/role/admin', ensureAdminAuth, assignAdminRoleController);
userRouter.delete('/:idUser/role/admin', ensureAdminAuth, removeAdminRoleController);
userRouter.patch('/:idUser/disable', ensureAdminAuth, disableUserController);
userRouter.patch('/:idUser/enable', ensureAdminAuth, enableUserController);
userRouter.delete('/:idUser', ensureAdminAuth, deleteUserController);

export default userRouter;
