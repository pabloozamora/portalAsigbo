import { single as activitySingle } from '../activity/activity.dto.js';
import { single as userSingle } from '../user/user.dto.js';

const single = (resource) => {
  const {
    user, activity, pendingPayment, completed,
  } = resource._doc;
  return {
    id: resource._id?.valueOf(),
    user: userSingle(user),
    activity: activitySingle(activity),
    pendingPayment,
    completed,
  };
};

const multiple = (resources) => resources.map((resource) => single(resource));

export { single, multiple };
