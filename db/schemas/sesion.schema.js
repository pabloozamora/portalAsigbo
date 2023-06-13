import { Schema, model } from 'mongoose';
import { ObjectId } from 'mongodb';

const sesionSchema = Schema({
  idUser: { type: ObjectId, ref: 'user', required: true },
  token: { type: String, required: true },
});

const SesionSchema = model('sesion', sesionSchema);
export default SesionSchema;
