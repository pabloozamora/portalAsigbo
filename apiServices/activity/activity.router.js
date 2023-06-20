import express from 'express';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';
import {
  assignManyUsersToActivityController,
  assignUserToActivityController,
  createActivityController,
  updateActivityController,
} from './activity.controller.js';
import validateBody from '../../middlewares/validateBody.js';
import createActivitySchema from './validationSchemas/createActivitySchema.js';
import assignActivitySchema from './validationSchemas/assignActivitySchema.js';
import assignManyUsersToActivitySchema from './validationSchemas/assignManyUsersToActivitySchema.js';
import updateActivitySchema from './validationSchemas/updateActivitySchema.js';

const activityRouter = express.Router();

activityRouter.post(
  '/',
  ensureAdminAuth,
  validateBody(createActivitySchema),
  createActivityController,
);
activityRouter.post(
  '/assign',
  ensureAdminAuth,
  validateBody(assignActivitySchema),
  assignUserToActivityController,
);
activityRouter.post(
  '/assignMany',
  ensureAdminAuth,
  validateBody(assignManyUsersToActivitySchema),
  assignManyUsersToActivityController,
);
activityRouter.patch(
  '/',
  ensureAdminAuth,
  validateBody(updateActivitySchema),
  updateActivityController,
);

export default activityRouter;
