import express from 'express';

import validateBody from '../../middlewares/validateBody.js';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';
import createPaymentSchema from './validationSchemas/createPaymentSchema.js';
import {
  completePaymentController, confirmPaymentController, createActivityPaymentController, createGeneralPaymentController, deletePaymentController, resetPaymentCompletedStatusController,
  updatePaymentController,
} from './payment.controller.js';
import ensureRolesAuth from '../../middlewares/ensureRolesAuth.js';
import multerMiddleware from '../../middlewares/multerMiddleware.js';
import uploadImage from '../../services/uploadFiles/uploadImage.js';
import validateParams from '../../middlewares/validateParams.js';
import paymentAssignmentParamSchema from './validationSchemas/paymentAssignmentParamSchema.js';
import ensureTreasurerAuth from '../../middlewares/ensureTreasurerAuth.js';
import paymentParamSchema from './validationSchemas/paymentParamSchema.js';
import updatePaymentSchema from './validationSchemas/updatePaymentSchema.js';
import ensureAreaResponsibleAuth from '../../middlewares/ensureAreaResponsibleAuth.js';
import createActivityPaymentSchema from './validationSchemas/createActivityPaymentSchema.js';

const paymentRouter = express.Router();

paymentRouter.post(
  '/',
  ensureAdminAuth,
  validateBody(createPaymentSchema),
  createGeneralPaymentController,
);
paymentRouter.post(
  '/activity',
  ensureAreaResponsibleAuth,
  validateBody(createActivityPaymentSchema),
  createActivityPaymentController,
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

paymentRouter.patch(
  '/assignment/:idPaymentAssignment/confirm',
  ensureTreasurerAuth,
  validateParams(paymentAssignmentParamSchema),
  confirmPaymentController,
);

paymentRouter.patch(
  '/:idPayment',
  ensureAreaResponsibleAuth,
  validateParams(paymentParamSchema),
  validateBody(updatePaymentSchema),
  updatePaymentController,
);
paymentRouter.delete(
  '/:idPayment',
  ensureAreaResponsibleAuth,
  validateParams(paymentParamSchema),
  deletePaymentController,
);

export default paymentRouter;
