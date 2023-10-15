import CustomError from '../../utils/customError.js';
import SessionSchema from '../../db/schemas/session.schema.js';
import UserSchema from '../../db/schemas/user.schema.js';
import single from './session.dto.js';
import consts from '../../utils/consts.js';

const storeSessionToken = async ({
  idUser, token, tokenType, linkedToken, session,
}) => {
  const sessionObj = new SessionSchema();

  sessionObj.idUser = idUser;
  sessionObj.token = token;
  sessionObj.tokenType = tokenType;
  sessionObj.linkedToken = linkedToken;

  return sessionObj.save({ session });
};

const deleteSessionToken = async (token) => {
  const result = await SessionSchema.deleteOne({ token });
  if (result?.deletedCount !== 1) { throw new CustomError('No fue posible eliminar el refresh token.', 500); }
};

const deleteLinkedTokens = async (linkedToken) => SessionSchema.deleteMany({ linkedToken });

/**
 * Permite validar un session token.
 * @param {string} idUser
 * @param {string} token
 * @returns Boolean. Indica si el token requiere ser actualizado.
 */
const validateSessionToken = async (idUser, token) => {
  const result = await SessionSchema.findOne({ idUser, token });

  if (result === null) throw new CustomError('Session token inválido.', 401);
  return result.needUpdate;
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

const forceUserLogout = async (idUser, session) => SessionSchema.deleteMany({ idUser }, { session });

const deleteAccessTokens = async ({ idUser, session }) => SessionSchema.deleteMany({
  idUser,
  tokenType: consts.token.access,
}, { session });

const forceSessionTokenToUpdate = async ({ idUser, session }) => {
  await SessionSchema.updateOne({ idUser, tokenType: consts.token.refresh }, { needUpdate: true }, { session });
  await deleteAccessTokens({ idUser, session }); // Eliminar tokens viejos
};

export {
  storeSessionToken,
  deleteSessionToken,
  authenticate,
  validateSessionToken,
  deleteLinkedTokens,
  forceUserLogout,
  forceSessionTokenToUpdate,
  deleteAccessTokens,
};
