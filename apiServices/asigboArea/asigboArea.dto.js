const single = (resource) => {
  const {
    name, responsible, blocked,
  } = resource._doc;
  return {
    id: resource._id.valueOf(),
    name,
    responsible,
    blocked,
  };
};

const multiple = (resources) => resources.map((resource) => single(resource));

export { single, multiple };
