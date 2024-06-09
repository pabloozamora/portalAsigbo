import { Schema, model } from 'mongoose';
import userSubSchema from './subUser.schema.js';
import { paymentSubSchema } from './payment.schema.js';

const paymentAssignmentSchema = Schema({
  user: { type: userSubSchema, required: true },
  payment: { type: paymentSubSchema, required: true },
  vouchersKey: { type: [String] },
  completed: { type: Boolean, default: false },
  confirmed: { type: Boolean, default: false },
  completedDate: { type: Date },
  confirmedDate: { type: Date },
  treasurer: { type: userSubSchema },
});

const PaymentAssignmentSchema = model('paymentAssignment', paymentAssignmentSchema);
export default PaymentAssignmentSchema;
