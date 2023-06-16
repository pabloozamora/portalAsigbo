const single = (resource, showSensitiveData, showHours) => {
  const {
    code, name, lastname, email, promotion, sex, serviceHours, blocked,
  } = resource._doc;
  return {
    id: resource._id.valueOf(),
    code,
    name,
    lastname,
    email: showSensitiveData ? email : undefined,
    promotion,
    sex,
    serviceHours: showSensitiveData || showHours ? serviceHours : undefined,
    blocked: showSensitiveData ? blocked : undefined,
  };
};

const multiple = (resources, showSensitiveData) => resources.map((resource) => single(resource, showSensitiveData));

export { single, multiple };
