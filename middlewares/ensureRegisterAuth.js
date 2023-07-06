import { deleteAlterUserToken } from '../apiServices/user/user.model.js';
import { validateToken } from '../services/jwt.js';
import consts from '../utils/consts.js';

const ensureRegisterAuth = async (req, res, next) => {
  const authToken = req.headers?.authorization;

  if (!authToken) {
    res.statusMessage = 'No se ha especificado el token de autorización.';
    return res.sendStatus(401);
  }

  try {
    const userData = await validateToken(authToken);

    if (userData.type !== consts.token.register) {
      res.statusMessage = 'El token de autorización no es de tipo register.';
      return res.sendStatus(401);
    }

    req.session = userData;
    next();
  } catch (ex) {
    deleteAlterUserToken(authToken);
    res.statusMessage = 'El token de autorización no es válido o ha expirado.';
    res.sendStatus(401);
  }

  return null;
};

export default ensureRegisterAuth;
