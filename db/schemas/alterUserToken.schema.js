import { Schema, model } from 'mongoose';
import { ObjectId } from 'mongodb';
import getUTCDate from '../../utils/getUTCDate.js';

const alterUserTokenSchema = Schema({
  idUser: {
    type: ObjectId, ref: 'user', required: true, unique: true,
  },
  token: { type: String, required: true },
  tokenType: { type: String, required: true },
  date: {type:Date, default: getUTCDate()}
});

const AlterUserTokenSchema = model('alterUserToken', alterUserTokenSchema);
export default AlterUserTokenSchema;
