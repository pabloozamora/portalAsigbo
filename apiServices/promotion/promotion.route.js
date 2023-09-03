import express from 'express';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';
import validateBody from '../../middlewares/validateBody.js';
import saveCurrentStudentPromotionsSchema from './validationSchemas/saveCurrentStudentPromotionsSchema.js';
import { getPromotionsGroupsController, saveCurrentStudentPromotionsController } from './promotion.controller.js';

const promotionRouter = express.Router();

promotionRouter.get('/', ensureAdminAuth, getPromotionsGroupsController);

promotionRouter.post(
  '/currentStudents',
  ensureAdminAuth,
  validateBody(saveCurrentStudentPromotionsSchema),
  saveCurrentStudentPromotionsController,
);

export default promotionRouter;
