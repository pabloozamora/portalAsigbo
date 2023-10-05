import { Schema, model } from 'mongoose';
import { ObjectId } from 'mongodb';
import { paymentSubSchema } from './payment.schema.js';
import UserSubSchema from './subUser.schema.js';
import consts from '../../utils/consts.js';
import { asigboAreaSubSchema } from './asigboArea.schema.js';

const activitySchema = Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  serviceHours: { type: Number, required: true },
  description: { type: String, required: true },
  responsible: {
    type: [UserSubSchema],
    required: true,
    validate: {
      validator(responsibles) {
        return responsibles.length > 0;
      },
      message: 'Debe proporcionar al menos un encargado de la actividad.',
    },
  },
  asigboArea: { type: asigboAreaSubSchema, required: true },
  payment: { type: paymentSubSchema },
  registrationStartDate: { type: Date, required: true },
  registrationEndDate: { type: Date, required: true },
  participatingPromotions: {
    type: [String],
    default: null,
    validate: {
      validator(list) {
        // buscar valores que no cumplen
        const result = list?.find((value) => {
          if (!Number.isNaN(parseInt(value, 10))) {
            const number = parseInt(value, 10);
            return !(number >= 2000 && number <= 2100);
          }
          return !Object.values(consts.promotionsGroups).includes(value);
        });

        return result === undefined;
      },
      message: 'Debe contener el año de la promoción o el grupo al que pertenece.',
    },
  },
  availableSpaces: {
    type: Number,
    required: true,
    min: [0, 'El número mínimo de participantes es 0.'],
  },
  blocked: { type: Boolean, default: false },
  hasBanner: { type: Boolean, default: false },
});

const activitySubSchema = Schema({
  _id: { type: ObjectId, ref: 'activity', required: true },
  name: { type: String, required: true },
  date: { type: Date, required: true },
  serviceHours: { type: Number, required: true },
  asigboArea: { type: asigboAreaSubSchema, required: true },
  blocked: { type: Boolean, default: false },
});

const ActivitySchema = model('activity', activitySchema);
export default ActivitySchema;
export { activitySubSchema };
