import { Schema, model } from 'mongoose';
import { userSubSchema } from './user.schema.js';
import { activitySubSchema } from './activity.schema.js';

const activityAssignmentSchema = Schema({
  user: { type: userSubSchema, required: true },
  activity: { type: activitySubSchema, required: true },
  pendingPayment: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
});

activityAssignmentSchema.index({ 'user._id': 1, 'activity._id': 1 }, { unique: true });

const ActivityAssignmentSchema = model('activityAssignment', activityAssignmentSchema);
export default ActivityAssignmentSchema;

// db.runCommand({collMod: "activityAssignment", changeStreamPreAndPostImages: {enabled: true, preAndPostImages: { expireAfterSeconds: 100 }}})
