import { Schema, model } from 'mongoose';
import UserSubSchema from './subUser.schema.js';
import { activitySubSchema } from './activity.schema.js';

const activityAssignmentSchema = Schema({
  user: { type: UserSubSchema, required: true },
  activity: { type: activitySubSchema, required: true },
  pendingPayment: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  aditionalServiceHours: { type: Number, default: 0, min: 0 },
});

activityAssignmentSchema.index({ 'user._id': 1, 'activity._id': 1 }, { unique: true });

const ActivityAssignmentSchema = model('activityAssignment', activityAssignmentSchema);
export default ActivityAssignmentSchema;

// db.runCommand({collMod: "activityAssignment", changeStreamPreAndPostImages: {enabled: true, preAndPostImages: { expireAfterSeconds: 100 }}})
