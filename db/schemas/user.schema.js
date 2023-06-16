import { Schema, model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { asigboAreaSubSchema } from './asigboArea.schema.js';

const userSchema = Schema({
  code: { type: Number, unique: true, required: [true, 'El atributo code es oblgatorio'] },
  name: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  promotion: { type: Number, required: true },
  role: {
    type: [{
      type: String,
      required: true,
    }],
  },
  passwordHash: { type: String },
  serviceHours: {
    areas: { type: Object, default: {} },
    total: Number,
  },
  blocked: { type: Boolean, default: false },
  sex: { type: String, required: true },
});

const userSubSchema = Schema({
  _id: { type: ObjectId, ref: 'user', required: true },
  name: { type: String, required: true },
  lastname: { type: String, required: true },
  promotion: { type: Number, required: true },
});

const UserSchema = model('user', userSchema);
export default UserSchema;
export { userSubSchema };
