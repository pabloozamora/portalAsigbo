import express from 'express';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';
import ensureRefreshTokenAuth from '../../middlewares/ensureRefreshTokenAuth.js';

import {
  assignManyUsersToActivityController,
  assignUserToActivityController,
  getActivitiesAssigmentsByActivityController,
  getActivitiesAssigmentsController,
  getLoggedActivitiesController,
  unassignUserFromActivityController,
  updateActivityAssignmentController,
} from './activityAssignment.controller.js';
import validateBody from '../../middlewares/validateBody.js';
import assignManyUsersToActivitySchema from './validationSchemas/assignManyUsersToActivitySchema.js';
import validateParams from '../../middlewares/validateParams.js';
import requiredIdUserSchema, {
  optionalIdUserSchema,
} from './validationSchemas/requiredIdUserSchema.js';
import requiredIdActivitySchema from './validationSchemas/requiredIdActivitySchema.js';
import updateAssignmentSchema from './validationSchemas/updateAssignmentSchema.js';
import validateQuery from '../../middlewares/validateQuery.js';

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

activityAssignmentRouter.get(
  '/assignment',
  ensureAdminAuth,
  validateQuery(optionalIdUserSchema),
  getActivitiesAssigmentsController,
);
activityAssignmentRouter.get(
  '/:idActivity/assignment',
  ensureAdminAuth,
  validateParams(requiredIdActivitySchema),
  getActivitiesAssigmentsByActivityController,
);
activityAssignmentRouter.get(
  '/assignment/logged',
  ensureRefreshTokenAuth,
  getLoggedActivitiesController,
);

activityAssignmentRouter.patch(
  '/:idActivity/assignment/:idUser',
  ensureAdminAuth,
  validateParams(requiredIdUserSchema),
  validateBody(updateAssignmentSchema),
  updateActivityAssignmentController,
);
activityAssignmentRouter.delete(
  '/:idActivity/assignment/:idUser',
  ensureAdminAuth,
  validateParams(requiredIdUserSchema, requiredIdActivitySchema),
  unassignUserFromActivityController,
);

export default activityAssignmentRouter;
