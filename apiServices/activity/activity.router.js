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
import ensureRolesAuth from '../../middlewares/ensureRolesAuth.js';
import consts from '../../utils/consts.js';
import multerMiddleware from '../../middlewares/multerMiddleware.js';
import uploadImage from '../../services/uploadFiles/uploadImage.js';

const activityRouter = express.Router();

activityRouter.get(
  '/',
  ensureRolesAuth([
    consts.roles.admin,
    consts.roles.asigboAreaResponsible,
    consts.roles.activityResponsible,
  ], 'No se cuenta con los privilegios de administrador, responsable de área o encargado de actividad.'),
  getActivitiesController,
);
activityRouter.get('/logged', ensureRefreshTokenAuth, getLoggedActivitiesController);

activityRouter.get('/:idActivity', ensureRefreshTokenAuth, getActivityController);

activityRouter.get('/:idUser', ensureAdminAuth, getUserActivitiesController);

activityRouter.post(
  '/',
  ensureAdminAuth,
  multerMiddleware(uploadImage.single('banner')),
  validateBody(createActivitySchema),
  createActivityController,
);
activityRouter.patch(
  '/',
  ensureRolesAuth([consts.roles.admin, consts.roles.asigboAreaResponsible]),
  multerMiddleware(uploadImage.single('banner')),
  validateBody(updateActivitySchema),
  updateActivityController,
);

activityRouter.delete('/:idActivity', ensureAdminActivityResponsibleAuth, deleteActivityController);

activityRouter.patch(
  '/:idActivity/enable',
  ensureAdminAreaResponsibleAuth,
  enableActivityController,
);
activityRouter.patch(
  '/:idActivity/disable',
  ensureAdminAreaResponsibleAuth,
  disableActivityController,
);

export default activityRouter;
