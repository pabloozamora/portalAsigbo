import consts from '../../utils/consts.js';
import exists from '../../utils/exists.js';
import { forceSessionTokenToUpdate } from '../session/session.model.js';
import { addRoleToUser, getUsersInList, removeRoleFromUser } from '../user/user.model.js';
import { createPayment as createPaymentModel, getPaymentsWhereUserIsTreasurer, updatePayment as updatePaymentModel } from './payment.model.js';

const addTreasurerRole = async ({ idUser, session }) => {
  const roleAdded = await addRoleToUser({ idUser, role: consts.roles.treasurer, session });
  if (roleAdded) await forceSessionTokenToUpdate({ idUser, session });
};

const removeTreasurerRole = async ({ idUser, session }) => {
  // Remover rol solo si ya no tiene más pagos a cargo
  const paymentsWhereIsTreasurer = await getPaymentsWhereUserIsTreasurer({ idUser, session });
  if (paymentsWhereIsTreasurer.length === 0) {
    await removeRoleFromUser({ idUser, role: consts.roles.treasurer, session });
    // Forzar actualizar sesión del usuario
    await forceSessionTokenToUpdate({ idUser, session });
  }
};

const createPayment = async ({
  name, limitDate, amount, description, treasurerUsersId, targetUsers, activityPayment, session,
}) => {
  // Obtener objetos de usuarios tesoreros
  const treasurerUsers = await getUsersInList({ idUsersList: treasurerUsersId, session, missingUserError: 'Uno de los usuarios especificados como tesoreros no existe.' });

  // Crear pago
  const payment = await createPaymentModel({
    name, limitDate, amount, description, treasurer: treasurerUsers, targetUsers, activityPayment, session,
  });

  // Asignar role de tesorero
  await Promise.all(treasurerUsersId.map((idUser) => addTreasurerRole({ idUser, session })));

  return payment;
};

const updatePayment = async ({
  idPayment, name, limitDate, amount, description, treasurerUsersId, includeActivityPayments, session,
}) => {
  // Obtener objetos de usuarios tesoreros
  const treasurerUsers = exists(treasurerUsersId)
    ? await getUsersInList({ idUsersList: treasurerUsersId, session, missingUserError: 'Uno de los usuarios especificados como tesoreros no existe.' })
    : null;

  // Actualizar datos de pago
  const { dataBeforeChange, updatedData } = await updatePaymentModel({
    idPayment, name, limitDate, amount, description, treasurer: treasurerUsers, includeActivityPayments, session,
  });

  // Retirar permisos a tesoreros eliminados (si corresponde)
  const usersRemovedId = dataBeforeChange.treasurer
    .filter(
      (beforeUser) => !updatedData.treasurer.some((updatedUser) => beforeUser._id === updatedUser._id),
    )
    .map((user) => user._id);

  // Asignar role de tesorero
  await Promise.all(usersRemovedId.map((idUser) => removeTreasurerRole({ idUser, session })));

  return updatedData;
};

export { createPayment, updatePayment };
