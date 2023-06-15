import express from 'express';
import {
  addResponsibleController, createAsigboAreaController, deleteAsigboAreaController, getActiveAreasController, removeResponsibleController, updateAsigboAreaController,
} from './asigboArea.controller.js';
import validateBody from '../../middlewares/validateBody.js';
import createAsigboAreaSchema from './validationSchemas/createAsigboAreaSchema.js';
import updateAsigboAreaSchema from './validationSchemas/updateAsigboAreaSchema.js';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';

const asigboAreaRouter = express.Router();

asigboAreaRouter.post('/', ensureAdminAuth, validateBody(createAsigboAreaSchema), createAsigboAreaController);
asigboAreaRouter.put('/update', ensureAdminAuth, validateBody(updateAsigboAreaSchema), updateAsigboAreaController);
asigboAreaRouter.put('/responsible', ensureAdminAuth, addResponsibleController);
asigboAreaRouter.put('/delete', ensureAdminAuth, deleteAsigboAreaController);
asigboAreaRouter.put('/responsible/remove', ensureAdminAuth, removeResponsibleController);
asigboAreaRouter.get('/', ensureAdminAuth, getActiveAreasController);

export default asigboAreaRouter;
