import UserSchema from '../../db/schemas/user.schema.js';
import CustomError from '../../utils/customError.js';

const getUser = async (idUser) => {
  const user = await UserSchema.findById(idUser);
  if (user === null) throw new CustomError('El usuario indicado no existe.', 404);

  return user;
};

const createUser = async ({
  code, name, lastname, email, promotion, role, passwordHash, sex,
}) => {
  try {
    const user = new UserSchema();

    user.code = code ?? null;
    user.name = name;
    user.lastname = lastname;
    user.email = email;
    user.promotion = promotion;
    user.role = role;
    user.passwordHash = passwordHash;
    user.sex = sex;

    await user.save();
    return user;
  } catch (ex) {
    if (ex.code === 11000 && ex.keyValue?.code !== undefined) throw new CustomError('El código proporcionado ya existe.', 400);
    if (ex.code === 11000 && ex.keyValue?.email !== undefined) throw new CustomError('El email ya se encuentra registrado.', 400);
    if (ex.code === 'ERR_ASSERTION' && ex.path === 'code') throw new CustomError('El código de usuario debe ser un número.');
    throw ex;
  }
};

const getActiveUsers = async (idUser) => {
  const users = await UserSchema.find({ blocked: false, _id: { $ne: idUser } });

  if (users.length === 0) throw new CustomError('No se han encontrado usuarios.', 404);

  return users;
};

export { createUser, getActiveUsers, getUser };
