const single = (resource) => {
  const {
    code, name, lastname, promotion, sex, role,
  } = resource._doc;
  return {
    id: resource._id.valueOf(),
    code,
    name,
    lastname,
    promotion,
    sex,
    role,
  };
};

export default single;
