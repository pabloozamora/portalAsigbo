import { connection } from '../../db/connection.js';
import CustomError from '../../utils/customError.js';
import errorSender from '../../utils/errorSender.js';
import Promotion from '../promotion/promotion.model.js';
import {
  getUsersByPromotion,
} from '../user/user.model.js';
import { createPayment } from './payment.mediator.js';
import { assignPaymentToUsers } from './payment.model.js';

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

    // Crear pago
    const payment = await createPayment({
      name, limitDate, amount, description, treasurerUsersId: treasurer, targetUsers: promotion, session,
    });

    // Generar asignaciones de pagos a usuarios
    await assignPaymentToUsers({ users: usersList, payment, session });

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
