import { deleteSessionToken, validateSessionToken } from '../apiServices/session/session.model.js';
import { validateToken } from '../services/jwt.js';
import consts from '../utils/consts.js';
import CustomError from '../utils/customError.js';

const ensureAdminActivityResponsibleAuth = async (req, res, next) => {
  const authToken = req.headers?.authorization;
  try {
    if (!authToken) {
      throw new CustomError('No se ha especificado el token de autorización.', 401);
    }

    const userData = await validateToken(authToken);

    // Validar en la base de datos
    await validateSessionToken(userData.id, authToken);

    if (userData.type !== consts.token.access) {
      throw new CustomError('El token de autorización no es de tipo access.', 401);
    }

    if (!(userData.role?.includes(consts.roles.admin) || userData.role?.includes(consts.roles.activityResponsible))) {
      throw new CustomError('No se cuenta con los privilegios necesarios de administrador o encargado de actividad.', 403);
    }

    req.session = userData;
    next();
  } catch (ex) {
    // Eliminar token si es posible
    if (authToken) deleteSessionToken(authToken).catch(() => {});
    res.statusMessage = ex?.message ?? 'El token de autorización no es válido o ha expirado.';
    res.sendStatus(ex?.status ?? 401);
  }
};

export default ensureAdminActivityResponsibleAuth;
