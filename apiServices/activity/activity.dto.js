import { parseMultipleObjects, parseSingleObject } from '../../utils/parseMongoObject.js';

const single = (resource, showSensitiveData) => {
  const {
    name,
    date,
    serviceHours,
    responsible,
    asigboArea,
    payment,
    registrationStartDate,
    registrationEndDate,
  } = resource._doc;
  return {
    id: resource._id.valueOf(),
    name,
    date,
    serviceHours,
    responsible: showSensitiveData ? parseMultipleObjects(responsible) : undefined,
    asigboArea: parseSingleObject(asigboArea),
    payment: parseSingleObject(payment),
    registrationStartDate,
    registrationEndDate,
  };
};

const multiple = (resources, showSensitiveData) => {
  resources.map((resource) => single(resource, showSensitiveData));
};

export { single, multiple };
