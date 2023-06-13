import { Schema, model } from 'mongoose';
import { ObjectId } from 'mongodb';

const paymentAssignmentSchema = Schema({
  date: { type: Date, required: true },
  idUser: { type: ObjectId, ref: 'user', required: true },
  idPayment: { type: ObjectId, ref: 'payment', required: true },
  receipt: { type: String, required: true },
  completed: { type: Boolean, default: false },
  responsible: { type: ObjectId, ref: 'user', required: true },
});

const PaymentAssignmentSchema = model('paymentAssignment', paymentAssignmentSchema);
export default PaymentAssignmentSchema;
