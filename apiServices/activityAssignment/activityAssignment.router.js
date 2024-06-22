import express from 'express';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';

import {
  assignUserToActivityController,
  getActivitiesAssigmentsByActivityController,
  getActivitiesAssigmentsController,
  getActivityAssigmentController,
  getLoggedActivitiesController,
  getUserNotCompletedAssignmentsController,
  unassignUserFromActivityController,
  updateActivityAssignmentController,
} from './activityAssignment.controller.js';
import validateBody from '../../middlewares/validateBody.js';
import validateParams from '../../middlewares/validateParams.js';
import requiredIdUserSchema, {
  optionalIdUserSchema,
} from './validationSchemas/requiredIdUserSchema.js';
import requiredIdActivitySchema from './validationSchemas/requiredIdActivitySchema.js';
import updateAssignmentSchema from './validationSchemas/updateAssignmentSchema.js';
import validateQuery from '../../middlewares/validateQuery.js';
import ensureActivityResponsibleAuth from '../../middlewares/ensureActivityResponsibleAuth.js';
import ensureRolesAuth from '../../middlewares/ensureRolesAuth.js';

const activityAssignmentRouter = express.Router();

activityAssignmentRouter.post(
  '/:idActivity/assignment/:idUser',
  ensureActivityResponsibleAuth,
  validateParams(requiredIdUserSchema, requiredIdActivitySchema),
  assignUserToActivityController,
);

activityAssignmentRouter.get(
  '/assignment',
  ensureRolesAuth(null),
  validateQuery(optionalIdUserSchema),
  getActivitiesAssigmentsController,
);
activityAssignmentRouter.get(
  '/:idActivity/assignment',
  ensureRolesAuth(null),
  validateParams(requiredIdActivitySchema),
  getActivitiesAssigmentsByActivityController,
);
activityAssignmentRouter.get(
  '/:idActivity/assignment/:idUser',
  ensureAdminAuth,
  validateParams(requiredIdActivitySchema, requiredIdUserSchema),
  getActivityAssigmentController,
);
activityAssignmentRouter.get(
  '/assignment/logged',
  ensureRolesAuth(null),
  getLoggedActivitiesController,
);
activityAssignmentRouter.get(
  '/assignment/notCompleted',
  ensureRolesAuth(null),
  getUserNotCompletedAssignmentsController,
);

activityAssignmentRouter.patch(
  '/:idActivity/assignment/:idUser',
  ensureActivityResponsibleAuth,
  validateParams(requiredIdUserSchema),
  validateBody(updateAssignmentSchema),
  updateActivityAssignmentController,
);
activityAssignmentRouter.delete(
  '/:idActivity/assignment/:idUser',
  ensureActivityResponsibleAuth,
  validateParams(requiredIdUserSchema, requiredIdActivitySchema),
  unassignUserFromActivityController,
);

export default activityAssignmentRouter;
