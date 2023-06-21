import express from 'express';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';
import ensureRefreshTokenAuth from '../../middlewares/ensureRefreshTokenAuth.js';

import {
  assignManyUsersToActivityController,
  assignUserToActivityController,
  completeActivityAssignmentController,
  getLoggedActivitiesController,
  getUserActivitiesController,
  unassignUserFromActivityController,
  uncompleteActivityAssignmentController,
} from './activityAssignment.controller.js';
import validateBody from '../../middlewares/validateBody.js';
import assignActivitySchema from './validationSchemas/assignActivitySchema.js';
import assignManyUsersToActivitySchema from './validationSchemas/assignManyUsersToActivitySchema.js';
import activityAssignmentIdSchema from './validationSchemas/activityAssignmentIdSchema.js';

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
activityAssignmentRouter.patch(
  '/complete',
  ensureAdminAuth,
  validateBody(activityAssignmentIdSchema),
  completeActivityAssignmentController,
);
activityAssignmentRouter.patch(
  '/uncomplete',
  ensureAdminAuth,
  validateBody(activityAssignmentIdSchema),
  uncompleteActivityAssignmentController,
);
activityAssignmentRouter.delete(
  '/',
  ensureAdminAuth,
  validateBody(activityAssignmentIdSchema),
  unassignUserFromActivityController,
);

export default activityAssignmentRouter;
