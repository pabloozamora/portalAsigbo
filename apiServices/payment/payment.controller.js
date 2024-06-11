import fs from 'node:fs';
import { connection } from '../../db/connection.js';
import uploadFileToBucket from '../../services/cloudStorage/uploadFileToBucket.js';
import consts from '../../utils/consts.js';
import CustomError from '../../utils/customError.js';
import errorSender from '../../utils/errorSender.js';
import Promotion from '../promotion/promotion.model.js';
import { getUsersByPromotion } from '../user/user.model.js';
import { createPayment, updatePayment } from './payment.mediator.js';
import {
  assignPaymentToUsers, completePayment, confirmPayment, getPaymentAssignmetById, resetPaymentCompletedStatus,
} from './payment.model.js';
import exists from '../../utils/exists.js';
import compareObjectId from '../../utils/compareObjectId.js';
import deleteFileInBucket from '../../services/cloudStorage/deleteFileInBucket.js';
import writeLog from '../../utils/writeLog.js';
import PaymentSchema from '../../db/schemas/payment.schema.js';

const savePaymentVoucherPicture = async ({ file, idPayment, idUser }) => {
  const filePath = `${global.dirname}/files/${file.fileName}`;

  // subir archivos

  const fileKey = `${consts.bucketRoutes.paymentVoucher}/${idPayment}/${idUser}`;

  try {
    await uploadFileToBucket(fileKey, filePath, file.type);
  } catch (ex) {
    fs.unlink(filePath, () => {}); // eliminar archivos temporales

    throw new CustomError('No se pudo cargar los comprobantes de pago.', 500);
  }

  // eliminar archivos temporales
  fs.unlink(filePath, () => {});
  return fileKey;
};

const validateTreasurerRole = async ({ idPayment, idUser }) => {
  const payment = await PaymentSchema.findById(idPayment);
  if (!Array.isArray(payment?.treasurer)
  || !payment.treasurer.some((user) => compareObjectId(user.id, idUser))) {
    throw new CustomError('No tienes los privilegios para relizar esta acción.', 403);
  }
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
      promotion,
      promotionMin,
      promotionMax,
      includeBlocked: false,
      session,
    });

    if (!usersList || usersList.length === 0) {
      throw new CustomError(
        'No se encontraron usuarios para la promoción o grupo de promociones especificado.',
        404,
      );
    }

    // Crear pago
    const payment = await createPayment({
      name,
      limitDate,
      amount,
      description,
      treasurerUsersId: treasurer,
      targetUsers: promotion,
      session,
    });

    // Generar asignaciones de pagos a usuarios
    await assignPaymentToUsers({ users: usersList, payment, session });

    await session.commitTransaction();

    res.status(204).send(payment);
  } catch (ex) {
    await errorSender({
      res,
      ex,
      defaultError: 'Ocurrio un error al crear nuevo pago general.',
      session,
    });
  } finally {
    session.endSession();
  }
};

const completePaymentController = async (req, res) => {
  const { idPaymentAssignment } = req.params;
  const voucherFiles = req.uploadedFiles;
  const { id: idUser } = req.session;

  // Validar cantidad de archivos
  if (!exists(voucherFiles?.length) || voucherFiles.length === 0) {
    errorSender({
      res,
      defaultError: "El campo 'voucher' debe incluir por lo menos un archivo.",
      defaultStatus: 400,
    });
    return;
  }

  const session = await connection.startSession();

  let voucherKeys = null;
  try {
    session.startTransaction();

    const paymentAssignment = await getPaymentAssignmetById({ idPaymentAssignment });

    if (!paymentAssignment) throw new CustomError('La asignación de pago no existe.', 404);
    if (!compareObjectId(idUser, paymentAssignment.user.id)) throw new CustomError('No estas autorizado para completar el pago.', 403);
    if (paymentAssignment.completed === true) throw new CustomError('El pago ya fue completado.', 400);

    // Subir archivos de vouchers
    voucherKeys = await Promise.all(
      voucherFiles.map((file) => savePaymentVoucherPicture({
        file,
        idPayment: paymentAssignment.payment.id,
        idUser: paymentAssignment.user.id,
      })),
    );
    await completePayment({ idPaymentAssignment, voucherKeys, session });

    await session.commitTransaction();
    res.status(204).send({ ok: true });
  } catch (ex) {
    await errorSender({
      res,
      ex,
      defaultError: 'Ocurrio un error al completar pago.',
      session,
    });

    // Si hubo un error, intentar eliminar archivos en bucket
    voucherKeys?.map((fileKey) => deleteFileInBucket(fileKey).catch((err) => writeLog(2, err)));
  } finally {
    session.endSession();
  }
};

const resetPaymentCompletedStatusController = async (req, res) => {
  const { idPaymentAssignment } = req.params;
  const { id: idUser } = req.session;

  try {
    const paymentAssignment = await getPaymentAssignmetById({ idPaymentAssignment });

    if (!paymentAssignment) throw new CustomError('La asignación de pago no existe.', 404);
    if (paymentAssignment.confirmed) throw new CustomError('No se puede resetear el status de completado a un pago ya confirmado.', 400);

    await validateTreasurerRole({ idPayment: paymentAssignment.payment._id, idUser });

    if (paymentAssignment.completed) {
      await resetPaymentCompletedStatus({ idPaymentAssignment });
    }

    res.status(204).send({ ok: true });
  } catch (ex) {
    await errorSender({
      res,
      ex,
      defaultError: 'Ocurrio un error al resetear status de pago completado.',
    });
  }
};

const confirmPaymentController = async (req, res) => {
  const { idPaymentAssignment } = req.params;
  const { id: idUser } = req.session;

  try {
    const paymentAssignment = await getPaymentAssignmetById({ idPaymentAssignment });

    if (!paymentAssignment) throw new CustomError('La asignación de pago no existe.', 404);
    if (!paymentAssignment.completed) throw new CustomError('El pago aún no ha sido completado.', 400);

    await validateTreasurerRole({ idPayment: paymentAssignment.payment._id, idUser });

    await confirmPayment({ idPaymentAssignment });

    res.status(204).send({ ok: true });
  } catch (ex) {
    await errorSender({
      res,
      ex,
      defaultError: 'Ocurrio un error al resetear status de pago completado.',
    });
  }
};

const updateGeneralPaymentController = async (req, res) => {
  const {
    name, amount, description, limitDate, treasurer,
  } = req.body;

  const { idPayment } = req.params;
  const session = await connection.startSession();
  try {
    session.startTransaction();

    // actualizar pago
    const payment = await updatePayment({
      idPayment,
      name,
      limitDate,
      amount,
      description,
      treasurerUsersId: treasurer,
      includeActivityPayments: false,
      session,
    });

    await session.commitTransaction();

    res.status(200).send(payment);
  } catch (ex) {
    await errorSender({
      res,
      ex,
      defaultError: 'Ocurrio un error al actualizar pago general.',
      session,
    });
  } finally {
    session.endSession();
  }
};

export {
  createGeneralPaymentController,
  completePaymentController,
  resetPaymentCompletedStatusController,
  confirmPaymentController,
  updateGeneralPaymentController,
};
