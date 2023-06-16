import { parseSingleObject } from '../../utils/parseMongoObject.js';

const single = (resource) => {
  const {
    user, activity, pendingPayment, completed,
  } = resource._doc;
  return {
    id: resource._id.valueOf(),
    user: parseSingleObject(user),
    activity: parseSingleObject(activity),
    pendingPayment,
    completed,
  };
};

const multiple = (resources) => resources.map((resource) => single(resource));

export { single, multiple };
