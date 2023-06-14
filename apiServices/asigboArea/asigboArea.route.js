import express from 'express';
import { createAsigboAreaController } from './asigboArea.controller.js';
import validateBody from '../../middlewares/validateBody.js';
import createAsigboAreaSchema from './validationSchemas/createAsigboAreaSchema.js';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';

const asigboAreaRouter = express.Router();

asigboAreaRouter.post('/', ensureAdminAuth, validateBody(createAsigboAreaSchema), createAsigboAreaController);

export default asigboAreaRouter;
