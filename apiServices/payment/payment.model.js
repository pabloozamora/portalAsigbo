import PaymentSchema from '../../db/schemas/payment.schema.js';
import PaymentAssignmentSchema from '../../db/schemas/paymentAssignment.schema.js';
import { multiplePaymentDto, singlePaymentDto } from './payment.dto.js';
import { singlePaymentAssignmentDto } from './paymentAssignment.dto.js';

/**
 *
 * @param {string} name Nombre o "Concepto de" del pago
 * @param {Date} limitDate Fecha límite del pago
 * @param {String} description Descripción del pago
 * @param {userSubSchema} treasurer Array de objetos de usuario de tesoreros del pago.
 * @param {string} targetUsers Descripción de grupo de usuarios al que se aplicó pago.

  @returns singlePaymentDto
 */
const createPayment = async ({
  name, limitDate, amount, description, treasurer, targetUsers, session,
}) => {
  const payment = new PaymentSchema();

  payment.name = name;
  payment.limitDate = limitDate;
  payment.amount = parseFloat(amount);
  payment.description = description;
  payment.treasurer = treasurer;
  payment.targetUsers = targetUsers;

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
  const paymentAssignmentRes = await PaymentAssignmentSchema.findOne({ 'payment._id': payment._id, 'user._id': user._id }).session(session);
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
  const { deletedCount } = await PaymentAssignmentSchema.deleteOne({
    'user._id': idUser, 'payment._id': idPayment, completed: false,
  }, { session });
  return deletedCount > 0;
};

export {
  createPayment, assignPaymentToUsers, assignPaymentToUser, deletePaymentAssignment,
};
