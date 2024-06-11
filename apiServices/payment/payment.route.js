import express from 'express';

import validateBody from '../../middlewares/validateBody.js';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';
import createPaymentSchema from './validationSchemas/createPaymentSchema.js';
import { completePaymentController, createGeneralPaymentController, resetPaymentCompletedStatusController } from './payment.controller.js';
import ensureRolesAuth from '../../middlewares/ensureRolesAuth.js';
import multerMiddleware from '../../middlewares/multerMiddleware.js';
import uploadImage from '../../services/uploadFiles/uploadImage.js';
import validateParams from '../../middlewares/validateParams.js';
import paymentAssignmentParamSchema from './validationSchemas/paymentAssignmentParamSchema.js';
import ensureTreasurerAuth from '../../middlewares/ensureTreasurerAuth.js';

const paymentRouter = express.Router();

paymentRouter.post(
  '/',
  ensureAdminAuth,
  validateBody(createPaymentSchema),
  createGeneralPaymentController,
);
paymentRouter.patch(
  '/assignment/:idPaymentAssignment/complete',
  ensureRolesAuth(null),
  multerMiddleware(uploadImage.array('voucher', 3)),
  validateParams(paymentAssignmentParamSchema),
  completePaymentController,
);

paymentRouter.patch(
  '/assignment/:idPaymentAssignment/reset',
  ensureTreasurerAuth,
  validateParams(paymentAssignmentParamSchema),
  resetPaymentCompletedStatusController,
);

export default paymentRouter;
