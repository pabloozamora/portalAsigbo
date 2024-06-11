import PaymentSchema from '../../db/schemas/payment.schema.js';
import PaymentAssignmentSchema from '../../db/schemas/paymentAssignment.schema.js';
import CustomError from '../../utils/customError.js';
import exists from '../../utils/exists.js';
import { multiplePaymentDto, singlePaymentDto } from './payment.dto.js';
import { singlePaymentAssignmentDto } from './paymentAssignment.dto.js';

/**
 *
 * @param {string} name Nombre o "Concepto de" del pago
 * @param {Date} limitDate Fecha límite del pago
 * @param {String} description Descripción del pago
 * @param {userSubSchema} treasurer Array de objetos de usuario de tesoreros del pago.
 * @param {string} targetUsers Descripción de grupo de usuarios al que se aplicó pago.
 * @param {boolean} activityPayment Indica si un pago está vinculado a una actividad.

  @returns singlePaymentDto
 */
const createPayment = async ({
  name,
  limitDate,
  amount,
  description,
  treasurer,
  targetUsers,
  activityPayment,
  session,
}) => {
  const payment = new PaymentSchema();

  payment.name = name;
  payment.limitDate = limitDate;
  payment.amount = parseFloat(amount);
  payment.description = description;
  payment.treasurer = treasurer;
  payment.targetUsers = targetUsers;
  payment.activityPayment = activityPayment;

  await payment.save({ session });
  return singlePaymentDto(payment);
};

const assignPaymentToUsers = async ({ users, payment, session }) => {
  const paymentAssignments = users.map((user) => ({ user, payment }));
  const result = await PaymentAssignmentSchema.insertMany(paymentAssignments, { session });
  return multiplePaymentDto(result);
};

/**
 * Se encarga de realizar una asignación de pago individual a un usuario.
 * Si esta asignación ya existe no la duplica, solo retorna la existente
 * @param user Objeto con datos de subschema de usuario.
 * @param payment Objeto con datos de subschema de payment.
 * @param session Session de mongo
 * @returns PaymentAssignment dto.
 */
const assignPaymentToUser = async ({ user, payment, session }) => {
  // Retorna la asignación de pago existente (si la hay)
  const paymentAssignmentRes = await PaymentAssignmentSchema.findOne({
    'payment._id': payment._id,
    'user._id': user._id,
  }).session(session);
  if (paymentAssignmentRes) return paymentAssignmentRes;

  // Crear nueva asignación de pago
  const paymentAssignment = new PaymentAssignmentSchema();
  paymentAssignment.user = user;
  paymentAssignment.payment = payment;

  await paymentAssignment.save({ session });

  return singlePaymentAssignmentDto(paymentAssignment);
};

/**
 * Elimina la asignación de un pago para un usuario. Tomar en cuenta que no se pueden eliminar
 * pagos que ya han sido completados.
 * @param {objectId} idUser Id del usuario
 * @param {objectId} idPayment Id del pago
 * @returns Boolean. Indica si se eliminó la asignación
 */
const deletePaymentAssignment = async ({ idUser, idPayment, session }) => {
  const { deletedCount } = await PaymentAssignmentSchema.deleteOne(
    {
      'user._id': idUser,
      'payment._id': idPayment,
      completed: false,
    },
    { session },
  );
  return deletedCount > 0;
};

const getPaymentAssignmetById = async ({ idPaymentAssignment, session }) => {
  const result = await PaymentAssignmentSchema.findById(idPaymentAssignment).session(session);
  return result != null ? singlePaymentAssignmentDto(result) : null;
};

const completePayment = async ({ idPaymentAssignment, voucherKeys, session }) => {
  const { acknowledged, matchedCount } = await PaymentAssignmentSchema.updateOne(
    { _id: idPaymentAssignment },
    { $push: { vouchersKey: { $each: voucherKeys } }, completed: true },
    { session },
  );

  if (matchedCount === 0) throw new CustomError('No se encontró la asignación de pago.', 404);
  if (!acknowledged) throw new CustomError('No se pudo actualizar el status de completado de la asignación de pago.', 500);
};

const resetPaymentCompletedStatus = async ({ idPaymentAssignment, session }) => {
  const { acknowledged, matchedCount } = await PaymentAssignmentSchema.updateOne(
    { _id: idPaymentAssignment },
    { completed: false },
    { session },
  );

  if (matchedCount === 0) throw new CustomError('No se encontró la asignación de pago.', 404);
  if (!acknowledged) throw new CustomError('No se pudo actualizar el status de completado de la asignación de pago.', 500);
};

const confirmPayment = async ({ idPaymentAssignment, session }) => {
  const { acknowledged, matchedCount } = await PaymentAssignmentSchema.updateOne(
    { _id: idPaymentAssignment, completed: true },
    { confirmed: true },
    { session },
  );

  if (matchedCount === 0) throw new CustomError('No se encontró la asignación de pago.', 404);
  if (!acknowledged) throw new CustomError('No se pudo actualizar el status de confirmado de la asignación de pago.', 500);
};

const updatePayment = async ({
  idPayment, name, amount, description, limitDate, treasurer, includeActivityPayments = true, session,
}) => {
  const payment = await PaymentSchema.findById(idPayment);

  if (!payment) throw new CustomError('No se encontró el pago.', 404);

  if (!includeActivityPayments && payment.activityPayment) throw new CustomError('No se puede actualizar pagos vinculados a actividades.', 400);

  const dataBeforeChange = singlePaymentDto(payment);

  if (exists(name)) payment.name = name.trim();
  if (exists(amount)) payment.amount = amount;
  if (exists(description)) payment.description = description.trim();
  if (exists(limitDate)) payment.limitDate = new Date(limitDate);
  if (exists(treasurer)) payment.treasurer = treasurer;

  await payment.save({ session });

  const updatedData = singlePaymentDto(payment);
  return { dataBeforeChange, updatedData };
};

/**
 * Retorna los pagos en lo que un usuario figura como un tesorero.
 * @returns Devuelve un array de PaymentsDto con los resultados.
 */
const getPaymentsWhereUserIsTreasurer = async ({ idUser, session }) => {
  const payments = await PaymentSchema.find({ treasurer: { $elemMatch: { _id: idUser } } }).session(session);

  return multiplePaymentDto(payments);
};

export {
  createPayment,
  assignPaymentToUsers,
  assignPaymentToUser,
  deletePaymentAssignment,
  getPaymentAssignmetById,
  completePayment,
  resetPaymentCompletedStatus,
  confirmPayment,
  updatePayment,
  getPaymentsWhereUserIsTreasurer,
};
