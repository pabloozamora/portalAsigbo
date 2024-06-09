import express from 'express';

import validateBody from '../../middlewares/validateBody.js';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';
import createPaymentSchema from './validationSchemas/createPaymentSchema.js';
import { createGeneralPaymentController } from './payment.controller.js';

const paymentRouter = express.Router();

paymentRouter.post('/', ensureAdminAuth, validateBody(createPaymentSchema), createGeneralPaymentController);

export default paymentRouter;
