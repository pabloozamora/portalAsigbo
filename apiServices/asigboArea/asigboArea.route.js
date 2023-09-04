import express from 'express';
import {
  addResponsibleController,
  createAsigboAreaController,
  deleteAsigboAreaController,
  getActiveAreasController,
  removeResponsibleController,
  updateAsigboAreaController,
} from './asigboArea.controller.js';
import validateBody from '../../middlewares/validateBody.js';
import createAsigboAreaSchema from './validationSchemas/createAsigboAreaSchema.js';
import updateAsigboAreaSchema from './validationSchemas/updateAsigboAreaSchema.js';
import areaResponsibleSchema from './validationSchemas/areaResponsibleSchema.js';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';
import ensureAdminAreaResponsibleAuth from '../../middlewares/ensureAdminAreaResponsibleAuth.js';
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
  ensureAdminAreaResponsibleAuth,
  validateBody(updateAsigboAreaSchema),
  updateAsigboAreaController,
);
asigboAreaRouter.put(
  '/responsible',
  ensureAdminAreaResponsibleAuth,
  validateBody(areaResponsibleSchema),
  addResponsibleController,
);
asigboAreaRouter.put('/delete/:idArea', ensureAdminAuth, deleteAsigboAreaController);
asigboAreaRouter.put(
  '/responsible/remove',
  ensureAdminAreaResponsibleAuth,
  validateBody(areaResponsibleSchema),
  removeResponsibleController,
);
asigboAreaRouter.get('/', ensureAdminAuth, getActiveAreasController);

export default asigboAreaRouter;
