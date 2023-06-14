const parseSingleObject = (resource) => {
  if (!resource) return null;
  const data = resource._doc;
  const res = {
    id: resource._id.valueOf(),
    ...data,
  };
  delete res._id;
  return res;
};

const parseMultipleObjects = (resources) => {
  resources.map((resource) => parseSingleObject(resource));
};

export { parseSingleObject, parseMultipleObjects };
