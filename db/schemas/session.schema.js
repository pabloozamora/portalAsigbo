import { Schema, model } from 'mongoose';
import { ObjectId } from 'mongodb';

const sessionSchema = Schema({
  idUser: { type: ObjectId, ref: 'user', required: true },
  token: { type: String, required: true },
  linkedToken: { type: String },
});

const SessionSchema = model('session', sessionSchema);
export default SessionSchema;
