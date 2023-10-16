import express from 'express';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';
import ensureRefreshTokenAuth from '../../middlewares/ensureRefreshTokenAuth.js';

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
  getActivitiesWhereUserIsResponsibleController,
} from './activity.controller.js';
import validateBody from '../../middlewares/validateBody.js';
import createActivitySchema from './validationSchemas/createActivitySchema.js';
import updateActivitySchema from './validationSchemas/updateActivitySchema.js';
import ensureRolesAuth from '../../middlewares/ensureRolesAuth.js';
import multerMiddleware from '../../middlewares/multerMiddleware.js';
import uploadImage from '../../services/uploadFiles/uploadImage.js';
import ensureAreaResponsibleAuth from '../../middlewares/ensureAreaResponsibleAuth.js';
import ensureActivityResponsibleAuth from '../../middlewares/ensureActivityResponsibleAuth.js';

const activityRouter = express.Router();

activityRouter.get(
  '/',
  ensureActivityResponsibleAuth,
  getActivitiesController,
);
activityRouter.get('/logged', ensureRefreshTokenAuth, getLoggedActivitiesController);

activityRouter.get('/:idActivity', ensureRefreshTokenAuth, getActivityController);

activityRouter.get('/:idUser', ensureAdminAuth, getUserActivitiesController);

activityRouter.post(
  '/',
  ensureActivityResponsibleAuth,
  multerMiddleware(uploadImage.single('banner')),
  validateBody(createActivitySchema),
  createActivityController,
);
activityRouter.patch(
  '/',
  ensureAreaResponsibleAuth,
  multerMiddleware(uploadImage.single('banner')),
  validateBody(updateActivitySchema),
  updateActivityController,
);

activityRouter.delete(
  '/:idActivity',
  ensureAreaResponsibleAuth,
  deleteActivityController,
);

activityRouter.patch(
  '/:idActivity/enable',
  ensureAreaResponsibleAuth,
  enableActivityController,
);
activityRouter.patch(
  '/:idActivity/disable',
  ensureAreaResponsibleAuth,
  disableActivityController,
);

activityRouter.get(
  '/responsible/:idUser',
  ensureRolesAuth(null),
  getActivitiesWhereUserIsResponsibleController,
);

export default activityRouter;
