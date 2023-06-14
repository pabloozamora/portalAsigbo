const single = (resource) => {
  const {
    name, responsible,
  } = resource._doc;
  return {
    id: resource._id.valueOf(),
    name,
    responsible,
  };
};

const multiple = (resources) => {
  resources.map((resource) => single(resource));
};

export { single, multiple };
