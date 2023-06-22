import { parseMultipleObjects, parseSingleObject } from '../../utils/parseMongoObject.js';

const single = (resource, showSensitiveData) => {
  const {
    id,
    _id,
    name,
    date,
    serviceHours,
    responsible,
    asigboArea,
    payment,
    registrationStartDate,
    registrationEndDate,
    participatingPromotions,
    availableSpaces,
  } = resource._doc ?? resource;
  return {
    id: resource._id?.valueOf() ?? _id?.valueOf() ?? id,
    name,
    date,
    serviceHours,
    responsible: showSensitiveData ? parseMultipleObjects(responsible) : undefined,
    asigboArea: parseSingleObject(asigboArea),
    payment: parseSingleObject(payment),
    registrationStartDate,
    registrationEndDate,
    participatingPromotions: showSensitiveData ? participatingPromotions : undefined,
    availableSpaces,
  };
};

const multiple = (resources, showSensitiveData) => resources.map((resource) => single(resource, showSensitiveData));

export { single, multiple };
