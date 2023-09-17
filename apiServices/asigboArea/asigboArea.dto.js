import { multiple as multipleUser } from '../user/user.dto.js';

const single = (resource) => {
  const {
    _id, id, name, responsible, blocked,
  } = resource._doc ?? resource;
  return {
    id: resource._id?.valueOf() ?? _id?.valueOf() ?? id,
    _id: resource._id?.valueOf() ?? _id?.valueOf() ?? id,
    name,
    responsible: multipleUser(responsible),
    blocked,
  };
};

const multiple = (resources) => resources.map((resource) => single(resource));

export { single, multiple };
