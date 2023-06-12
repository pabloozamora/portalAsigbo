import { Schema, model } from 'mongoose';

const paymentSchema = Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  amount: { type: Number, required: true },
});

const PaymentSchema = model('payment', paymentSchema);
export default PaymentSchema;
