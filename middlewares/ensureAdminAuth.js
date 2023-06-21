import { validateToken } from '../services/jwt.js';
import consts from '../utils/consts.js';

const ensureAdminAuth = async (req, res, next) => {
  const authToken = req.headers?.authorization;

  if (!authToken) {
    res.statusMessage = 'No se ha especificado el token de autorización.';
    return res.sendStatus(401);
  }

  try {
    const userData = await validateToken(authToken);

    if (userData.type !== consts.token.access) {
      res.statusMessage = 'El token de autorización no es de tipo access.';
      return res.sendStatus(401);
    }

    if (!userData.role?.includes(consts.roles.admin)) {
      res.statusMessage = 'No se cuenta con los privilegios necesarios de administrador.';
      return res.sendStatus(403);
    }

    req.session = userData;
    next();
  } catch (ex) {
    res.statusMessage = 'El token de autorización no es válido o ha expirado.';
    res.sendStatus(401);
  }

  return null;
};

export default ensureAdminAuth;
