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
  const paymentAssignmentRes = await PaymentAssignmentSchema.findOne({ 'payment._id': payment._id }).session(session);
  if (paymentAssignmentRes) return paymentAssignmentRes;

  // Crear nueva asignación de pago
  const paymentAssignment = new PaymentAssignmentSchema();
  paymentAssignment.user = user;
  paymentAssignment.payment = payment;

  await paymentAssignment.save({ session });

  return singlePaymentAssignmentDto(paymentAssignment);
};

export { createPayment, assignPaymentToUsers, assignPaymentToUser };
