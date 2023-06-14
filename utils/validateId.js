import { ObjectId } from 'mongodb';

const validateId = (id) => {
  try {
    if (new ObjectId(id).toString() === id?.toString()) return true;
  } catch (ex) {
    // err
  }
  return false;
};

export default validateId;
