import express from 'express';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';
import ensureRefreshTokenAuth from '../../middlewares/ensureRefreshTokenAuth.js';
import ensureAdminActivityResponsibleAuth from '../../middlewares/ensureAdminActivityResponsibleAuth.js';

import {
  createActivityController,
  deleteActivityController,
  getActivitiesController,
  getActivityController,
  updateActivityController,
  getLoggedActivitiesController,
  getUserActivitiesController,
  enableActivityController,
  disableActivityController,
} from './activity.controller.js';
import validateBody from '../../middlewares/validateBody.js';
import createActivitySchema from './validationSchemas/createActivitySchema.js';
import updateActivitySchema from './validationSchemas/updateActivitySchema.js';
import ensureAdminAreaResponsibleAuth from '../../middlewares/ensureAdminAreaResponsibleAuth.js';

const activityRouter = express.Router();

activityRouter.get('/', ensureAdminAuth, getActivitiesController);
activityRouter.get(
  '/logged',
  ensureRefreshTokenAuth,
  getLoggedActivitiesController,
);

activityRouter.get('/:idActivity', ensureAdminActivityResponsibleAuth, getActivityController);

activityRouter.get(
  '/:idUser',
  ensureAdminAuth,
  getUserActivitiesController,
);

activityRouter.post(
  '/',
  ensureAdminAuth,
  validateBody(createActivitySchema),
  createActivityController,
);
activityRouter.patch(
  '/',
  ensureAdminActivityResponsibleAuth,
  validateBody(updateActivitySchema),
  updateActivityController,
);

activityRouter.delete('/:idActivity', ensureAdminActivityResponsibleAuth, deleteActivityController);

activityRouter.patch('/:idActivity/enable', ensureAdminAreaResponsibleAuth, enableActivityController);
activityRouter.patch('/:idActivity/disable', ensureAdminAreaResponsibleAuth, disableActivityController);

export default activityRouter;
