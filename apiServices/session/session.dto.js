const single = (resource) => {
  const {
    code, name, lastname, promotion, career, sex, role,
  } = resource._doc;
  return {
    id: resource._id.valueOf(),
    code,
    name,
    lastname,
    promotion,
    career,
    sex,
    role,
  };
};

export default single;
