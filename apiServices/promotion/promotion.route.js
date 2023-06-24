import express from 'express';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';
import validateBody from '../../middlewares/validateBody.js';
import saveCurrentStudentPromotionsSchema from './validationSchemas/saveCurrentStudentPromotionsSchema.js';
import { saveCurrentStudentPromotionsController } from './promotion.controller.js';

const promotionRouter = express.Router();

promotionRouter.post(
  '/currentStudents',
  ensureAdminAuth,
  validateBody(saveCurrentStudentPromotionsSchema),
  saveCurrentStudentPromotionsController,
);

export default promotionRouter;
