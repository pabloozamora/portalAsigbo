import express from 'express';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';
import ensureRefreshTokenAuth from '../../middlewares/ensureRefreshTokenAuth.js';

import {
  assignManyUsersToActivityController,
  assignUserToActivityController,
  getLoggedActivitiesController,
  getUserActivitiesController,
  unassignUserFromActivityController,
} from './activityAssignment.controller.js';
import validateBody from '../../middlewares/validateBody.js';
import assignActivitySchema from './validationSchemas/assignActivitySchema.js';
import assignManyUsersToActivitySchema from './validationSchemas/assignManyUsersToActivitySchema.js';
import unassignActivitySchema from './validationSchemas/unassignActivitySchema.js';

const activityAssignmentRouter = express.Router();

activityAssignmentRouter.post(
  '/',
  ensureAdminAuth,
  validateBody(assignActivitySchema),
  assignUserToActivityController,
);
activityAssignmentRouter.post(
  '/assignMany',
  ensureAdminAuth,
  validateBody(assignManyUsersToActivitySchema),
  assignManyUsersToActivityController,
);

activityAssignmentRouter.get('/user/:idUser', ensureAdminAuth, getUserActivitiesController);
activityAssignmentRouter.get('/logged', ensureRefreshTokenAuth, getLoggedActivitiesController);
activityAssignmentRouter.delete(
  '/',
  ensureAdminAuth,
  validateBody(unassignActivitySchema),
  unassignUserFromActivityController,
);

export default activityAssignmentRouter;
