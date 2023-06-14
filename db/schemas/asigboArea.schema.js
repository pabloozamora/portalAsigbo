import { Schema, model } from 'mongoose';
import { ObjectId } from 'mongodb';

const asigboAreaSchema = Schema({
  name: { type: String, required: true, unique: true },
  responsible: [{
    _id: { type: ObjectId, ref: 'user' },
    name: { type: String, requried: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true },
    promotion: { type: Number, requred: true },
  }],
});
const asigboAreaSubSchema = Schema({
  _id: { type: ObjectId, ref: 'asigboArea', required: true },
  name: { type: String, required: true },
});

const AsigboAreaSchema = model('asigboArea', asigboAreaSchema);
export default AsigboAreaSchema;
export { asigboAreaSubSchema };
