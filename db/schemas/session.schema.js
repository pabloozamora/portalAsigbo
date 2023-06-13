import { Schema, model } from 'mongoose';
import { ObjectId } from 'mongodb';

const sessionSchema = Schema({
  idUser: { type: ObjectId, ref: 'user', required: true },
  token: { type: String, required: true },
});

const SessionSchema = model('session', sessionSchema);
export default SessionSchema;
