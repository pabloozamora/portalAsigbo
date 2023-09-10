import express from 'express';
import {
  createAsigboAreaController,
  deleteAsigboAreaController,
  getActiveAreasController,
  getAsigboAreaController,
  updateAsigboAreaController,
} from './asigboArea.controller.js';
import validateBody from '../../middlewares/validateBody.js';
import createAsigboAreaSchema from './validationSchemas/createAsigboAreaSchema.js';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';
import multerMiddleware from '../../middlewares/multerMiddleware.js';
import uploadImage from '../../services/uploadFiles/uploadImage.js';

const asigboAreaRouter = express.Router();

asigboAreaRouter.post(
  '/',
  ensureAdminAuth,
  multerMiddleware(uploadImage.single('icon')),
  validateBody(createAsigboAreaSchema),
  createAsigboAreaController,
);
asigboAreaRouter.patch(
  '/:idArea',
  ensureAdminAuth,
  multerMiddleware(uploadImage.single('icon')),
  validateBody(createAsigboAreaSchema),
  updateAsigboAreaController,
);
asigboAreaRouter.delete('/:idArea', ensureAdminAuth, deleteAsigboAreaController);

asigboAreaRouter.get('/', ensureAdminAuth, getActiveAreasController);
asigboAreaRouter.get('/:idArea', ensureAdminAuth, getAsigboAreaController);

export default asigboAreaRouter;
