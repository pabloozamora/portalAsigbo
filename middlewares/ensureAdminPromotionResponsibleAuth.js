import consts from '../utils/consts.js';
import ensureRolesAuth from './ensureRolesAuth.js';

const ensureAdminPromotionResponsibleAuth = ensureRolesAuth(
  [consts.admin, consts.roles.promotionResponsible],
  'No se cuenta con los privilegios necesarios de administrador o encargado de año.',
);

export default ensureAdminPromotionResponsibleAuth;
