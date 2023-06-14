import express from 'express';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';
import { createActivityController } from './activity.controller.js';
import validateBody from '../../middlewares/validateBody.js';
import createActivitySchema from './validationSchemas/createActivitySchema.js';

const activityRouter = express.Router();

activityRouter.post('/', ensureAdminAuth, validateBody(createActivitySchema), createActivityController);

export default activityRouter;
