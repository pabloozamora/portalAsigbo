import PaymentSchema from '../../db/schemas/payment.schema.js';
import PaymentAssignmentSchema from '../../db/schemas/paymentAssignment.schema.js';
import { multiplePaymentDto, singlePaymentDto } from './payment.dto.js';

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

export { createPayment, assignPaymentToUsers };
