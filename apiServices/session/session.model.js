import CustomError from '../../utils/customError.js';
import SessionSchema from '../../db/schemas/session.schema.js';
import UserSchema from '../../db/schemas/user.schema.js';
import single from './session.dto.js';

const storeSessionToken = async ({
  idUser, token, linkedToken, session,
}) => {
  const sessionObj = new SessionSchema();

  sessionObj.idUser = idUser;
  sessionObj.token = token;
  sessionObj.linkedToken = linkedToken;

  return sessionObj.save({ session });
};

const deleteSessionToken = async (token) => {
  const result = await SessionSchema.deleteOne({ token });
  if (result?.deletedCount !== 1) throw new CustomError('No fue posible eliminar el refresh token.', 500);
};

const deleteLinkedTokens = async (linkedToken) => SessionSchema.deleteMany({ linkedToken });

const validateSessionToken = async (idUser, token) => {
  const result = await SessionSchema.findOne({ idUser, token });

  if (result === null) throw new CustomError('Session token inválido.', 401);
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
  storeSessionToken, deleteSessionToken, authenticate, validateSessionToken, deleteLinkedTokens,
};
