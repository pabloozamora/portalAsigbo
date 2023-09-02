import express from 'express';
import {
  addResponsibleController,
  createAsigboAreaController,
  deleteAsigboAreaController,
  getActiveAreasController,
  getAsigboAreaController,
  removeResponsibleController,
  updateAsigboAreaController,
} from './asigboArea.controller.js';
import validateBody from '../../middlewares/validateBody.js';
import createAsigboAreaSchema from './validationSchemas/createAsigboAreaSchema.js';
import updateAsigboAreaSchema from './validationSchemas/updateAsigboAreaSchema.js';
import areaResponsibleSchema from './validationSchemas/areaResponsibleSchema.js';
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
asigboAreaRouter.put(
  '/update/:idArea',
  ensureAdminAuth,
  validateBody(updateAsigboAreaSchema),
  updateAsigboAreaController,
);
asigboAreaRouter.put(
  '/responsible',
  ensureAdminAuth,
  validateBody(areaResponsibleSchema),
  addResponsibleController,
);
asigboAreaRouter.put('/delete/:idArea', ensureAdminAuth, deleteAsigboAreaController);
asigboAreaRouter.put(
  '/responsible/remove',
  ensureAdminAuth,
  validateBody(areaResponsibleSchema),
  removeResponsibleController,
);

asigboAreaRouter.get('/', ensureAdminAuth, getActiveAreasController);
asigboAreaRouter.get('/:idArea', ensureAdminAuth, getAsigboAreaController);

export default asigboAreaRouter;
