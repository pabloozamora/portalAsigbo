import exists from '../../utils/exists.js';

const parseServiceHours = (serviceHours) => {
  const areas = serviceHours?.areas?.map((val) => {
    const { asigboArea: { _id: id, name }, total } = val;
    return { asigboArea: { id, name }, total };
  });
  return { areas, total: serviceHours?.total };
};

const single = (resource, { showSensitiveData = false, showHours = false, showRole = false } = {}) => {
  const {
    code, name, lastname, email, promotion, career, sex, serviceHours, blocked, role, passwordHash,
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
    serviceHours: showSensitiveData || showHours ? parseServiceHours(serviceHours) : undefined,
    blocked: showSensitiveData ? blocked : undefined,
    role: showSensitiveData || showRole ? role : undefined,
    completeRegistration: exists(passwordHash),
  };
};

const multiple = (resources, { showSensitiveData, showHours, showRole } = {}) => resources?.map((resource) => single(resource, { showSensitiveData, showHours, showRole }));

export { single, multiple };
