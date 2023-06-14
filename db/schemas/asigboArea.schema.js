import { Schema, model } from 'mongoose';
import { ObjectId } from 'mongodb';

const asigboAreaSchema = Schema({
  name: { type: String, required: true },
  responsible: { type: ObjectId, ref: 'user', required: true },
});
const asigboAreaSubSchema = Schema({
  _id: { type: ObjectId, ref: 'asigboArea', required: true },
  name: { type: String, required: true },
});

const AsigboAreaSchema = model('asigboArea', asigboAreaSchema);
export default AsigboAreaSchema;
export { asigboAreaSubSchema };
