const single = (resource, { showSensitiveData = false, showHours = false, showRole = false } = {}) => {
  const {
    code, name, lastname, email, promotion, career, sex, serviceHours, blocked, role,
  } = resource?._doc ?? resource;
  return {
    id: resource?._id?.valueOf() ?? resource.id,
    code,
    name,
    lastname,
    email: showSensitiveData ? email : undefined,
    promotion,
    career,
    sex,
    serviceHours: showSensitiveData || showHours ? serviceHours : undefined,
    blocked: showSensitiveData ? blocked : undefined,
    role: showSensitiveData || showRole ? role : undefined,
  };
};

const multiple = (resources, { showSensitiveData, showHours, showRole } = {}) => resources.map((resource) => single(resource, { showSensitiveData, showHours, showRole }));

export { single, multiple };
