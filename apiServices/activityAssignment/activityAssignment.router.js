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
import assignManyUsersToActivitySchema from './validationSchemas/assignManyUsersToActivitySchema.js';
import validateParams from '../../middlewares/validateParams.js';
import requiredIdUserSchema from './validationSchemas/requiredIdUserSchema.js';
import requiredIdActivitySchema from './validationSchemas/requiredIdActivitySchema.js';

const activityAssignmentRouter = express.Router();

activityAssignmentRouter.post(
  '/:idActivity/assignment/:idUser',
  ensureAdminAuth,
  validateParams(requiredIdUserSchema, requiredIdActivitySchema),
  assignUserToActivityController,
);
activityAssignmentRouter.post(
  '/assignMany',
  ensureAdminAuth,
  validateBody(assignManyUsersToActivitySchema),
  assignManyUsersToActivityController,
);

activityAssignmentRouter.get('/:idActivity/assignment', ensureAdminAuth, validateParams(requiredIdActivitySchema), getActivitiesAssigmentsController);
activityAssignmentRouter.get('/assignment/logged', ensureRefreshTokenAuth, getLoggedActivitiesController);
activityAssignmentRouter.patch(
  '/:idActivity/assignment/:idUser/complete/',
  ensureAdminAuth,
  validateParams(requiredIdUserSchema, requiredIdActivitySchema),
  completeActivityAssignmentController,
);
activityAssignmentRouter.patch(
  '/:idActivity/assignment/:idUser/uncomplete/',
  ensureAdminAuth,
  validateParams(requiredIdUserSchema),
  uncompleteActivityAssignmentController,
);
activityAssignmentRouter.delete(
  '/:idActivity/assignment/:idUser',
  ensureAdminAuth,
  validateParams(requiredIdUserSchema, requiredIdActivitySchema),
  unassignUserFromActivityController,
);

export default activityAssignmentRouter;
