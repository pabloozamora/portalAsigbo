import CustomError from '../../utils/customError.js';
import SessionSchema from '../../db/schemas/session.schema.js';
import UserSchema from '../../db/schemas/user.schema.js';
import single from './session.dto.js';

const storeRefreshToken = async (idUser, token) => {
  const session = new SessionSchema();

  session.idUser = idUser;
  session.token = token;

  return session.save();
};

const deleteRefreshToken = async (token) => {
  const result = await SessionSchema.deleteOne({ token });
  if (result?.deletedCount !== 1) throw new CustomError('No fue posible eliminar el refresh token.', 500);
};

const validateRefreshToken = async (idUser, token) => {
  const result = await SessionSchema.findOne({ idUser, token });

  if (result === null) throw new CustomError('Refresh token inválido.', 401);
  return true;
};

const authenticate = async (user, passwordHash) => {
  const query = {
    $or: [{ code: user }, { email: user }],
    passwordHash,
    blocked: false,
  };

  // Si el usuario no es numerico, eliminar busqueda por código
  if (Number.isNaN(parseInt(user, 10))) {
    delete query.$or;
    query.email = user;
  }

  const result = await UserSchema.findOne(query);

  if (result === null) throw new CustomError('Usuario o contraseña incorrectos.', 400);
  return single(result);
};

export {
  storeRefreshToken, deleteRefreshToken, authenticate, validateRefreshToken,
};
