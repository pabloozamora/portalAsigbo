import { Schema, model } from 'mongoose';
import { ObjectId } from 'mongodb';

const activitySchema = Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  serviceHours: { type: Number, required: true },
  responsible: { type: ObjectId, ref: 'user', required: true },
  idAsigboArea: { type: ObjectId, ref: 'asigboArea', required: true },
  idPayment: { type: ObjectId, ref: 'payment', required: true },
});

const ActivitySchema = model('activity', activitySchema);
export default ActivitySchema;
