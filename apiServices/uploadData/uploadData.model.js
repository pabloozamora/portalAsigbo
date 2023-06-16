import UserSchema from '../../db/schemas/user.schema.js';
import CustomError from '../../utils/customError.js';

const generateUsers = async (users) => {
  try {
    await UserSchema.insertMany(users);
    return users;
  } catch (ex) {
    if (ex.errors) throw new CustomError(ex.errors[Object.keys(ex.errors)].message, 400);
    if (ex.code === 11000) {
      if (ex.message.includes('code')) throw new CustomError(`El id ${ex.writeErrors[0].err.op.code} ya existe en la base de datos`, 400);
      throw new CustomError(`El correo ${ex.writeErrors[0].err.op.email} ya existe en la base de datos`, 400);
    }
    throw ex;
  }
};

// eslint-disable-next-line import/prefer-default-export
export { generateUsers };
