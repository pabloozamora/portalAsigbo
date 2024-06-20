import express from 'express';
import {
  getActivityImageController, getAreaImageController, getPaymentVoucherImageController, getUserImageController,
} from './image.controller.js';

const imageRouter = express.Router();

imageRouter.get('/user/:id', getUserImageController);
imageRouter.get('/area/:id', getAreaImageController);
imageRouter.get('/activity/:id', getActivityImageController);
imageRouter.get('/paymentVoucher/:id(*)', getPaymentVoucherImageController);

export default imageRouter;
