import { Schema, model } from 'mongoose';
import { ObjectId } from 'mongodb';

const activityAssignmentSchema = Schema({
  idUser: { type: ObjectId, ref: 'user', required: true },
  idActivity: { type: ObjectId, ref: 'activity', required: true },
  enrolled: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
});

const ActivityAssignmentSchema = model('activityAssignment', activityAssignmentSchema);
export default ActivityAssignmentSchema;
