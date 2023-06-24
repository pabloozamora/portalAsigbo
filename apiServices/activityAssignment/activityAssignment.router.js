import express from 'express';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';
import ensureRefreshTokenAuth from '../../middlewares/ensureRefreshTokenAuth.js';

import {
  assignManyUsersToActivityController,
  assignUserToActivityController,
  completeActivityAssignmentController,
  getActivitiesAssigmentsController,
  getLoggedActivitiesController,
  unassignUserFromActivityController,
  uncompleteActivityAssignmentController,
} from './activityAssignment.controller.js';
import validateBody from '../../middlewares/validateBody.js';
import assignActivitySchema from './validationSchemas/assignActivitySchema.js';
import assignManyUsersToActivitySchema from './validationSchemas/assignManyUsersToActivitySchema.js';
import activityAssignmentIdSchema from './validationSchemas/activityAssignmentIdSchema.js';
import validateParams from '../../middlewares/validateParams.js';
import validateQuery from '../../middlewares/validateQuery.js';
import searchActivitiesSchema from './validationSchemas/searchActivitiesSchema.js';

const activityAssignmentRouter = express.Router();

activityAssignmentRouter.post(
  '/assign',
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

activityAssignmentRouter.get('/assignment', ensureAdminAuth, validateQuery(searchActivitiesSchema), getActivitiesAssigmentsController);
activityAssignmentRouter.get('/assignment/logged', ensureRefreshTokenAuth, getLoggedActivitiesController);
activityAssignmentRouter.patch(
  '/assignment/:idActivityAssignment/complete/',
  ensureAdminAuth,
  validateParams(activityAssignmentIdSchema),
  completeActivityAssignmentController,
);
activityAssignmentRouter.patch(
  '/assignment/:idActivityAssignment/uncomplete/',
  ensureAdminAuth,
  validateParams(activityAssignmentIdSchema),
  uncompleteActivityAssignmentController,
);
activityAssignmentRouter.delete(
  '/assignment/:idActivityAssignment',
  ensureAdminAuth,
  validateParams(activityAssignmentIdSchema),
  unassignUserFromActivityController,
);

export default activityAssignmentRouter;
