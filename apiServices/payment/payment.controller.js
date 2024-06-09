import { connection } from '../../db/connection.js';
import consts from '../../utils/consts.js';
import CustomError from '../../utils/customError.js';
import errorSender from '../../utils/errorSender.js';
import Promotion from '../promotion/promotion.model.js';
import { forceSessionTokenToUpdate } from '../session/session.model.js';
import {
  addRoleToUser, getUsersByPromotion, getUsersInList,
} from '../user/user.model.js';
import { assignPaymentToUsers, createPayment } from './payment.model.js';

const addTreasurerRole = async ({ idUser, session }) => {
  const roleAdded = await addRoleToUser({ idUser, role: consts.roles.treasurer, session });
  if (roleAdded) await forceSessionTokenToUpdate({ idUser, session });
};

const createGeneralPaymentController = async (req, res) => {
  const {
    name, amount, description, limitDate, treasurer, promotion,
  } = req.body;
  const session = await connection.startSession();
  try {
    session.startTransaction();

    // si se da un grupo de usuarios, definir rango de promociones
    let promotionMin = null;
    let promotionMax = null;

    if (promotion && Number.isNaN(parseInt(promotion, 10))) {
      const promotionObj = new Promotion();
      const result = await promotionObj.getPromotionRange({ promotionGroup: promotion });
      promotionMin = result.promotionMin;
      promotionMax = result.promotionMax;
    }

    // Obtener objeto de usuarios a asignar (sin bloqueados)
    // Genera error si no se encuentra usuarios
    const usersList = await getUsersByPromotion({
      promotion, promotionMin, promotionMax, includeBlocked: false, session,
    });

    if (!usersList || usersList.length === 0) throw new CustomError('No se encontraron usuarios para la promoción o grupo de promociones especificado.', 404);

    // Obtener objetos de usuarios tesoreros
    const treasurerUsers = await getUsersInList({ idUsersList: treasurer, session, missingUserError: 'Uno de los usuarios especificados como tesoreros no existe.' });

    // Crear pago
    const payment = await createPayment({
      name, limitDate, amount, description, treasurer: treasurerUsers, targetUsers: promotion, session,
    });

    // Generar asignaciones de pagos a usuarios
    await assignPaymentToUsers({ users: usersList, payment, session });

    // Asignar role de tesorero
    await Promise.all(treasurer.map((idUser) => addTreasurerRole({ idUser, session })));

    await session.commitTransaction();

    res.status(204).send({ ok: true });
  } catch (ex) {
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al crear nuevo pago general.', session,
    });
  } finally {
    session.endSession();
  }
};

export { createGeneralPaymentController };
