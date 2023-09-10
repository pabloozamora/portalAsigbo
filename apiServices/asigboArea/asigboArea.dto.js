const single = (resource, showSensitiveData = false) => {
  const {
    name, responsible, blocked,
  } = resource._doc;
  return {
    id: resource._id.valueOf(),
    name,
    responsible,
    blocked: showSensitiveData ? blocked : undefined,
  };
};

const multiple = (resources, showSensitiveData) => resources.map((resource) => single(resource, showSensitiveData));

export { single, multiple };
