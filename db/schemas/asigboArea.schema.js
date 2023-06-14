import { Schema, model } from 'mongoose';
import { ObjectId } from 'mongodb';

const asigboAreaSchema = Schema({
  name: { type: String, unique: true, required: true },
  responsible: [{ type: ObjectId, ref: 'user' }],
});

const AsigboAreaSchema = model('asigboArea', asigboAreaSchema);
export default AsigboAreaSchema;
