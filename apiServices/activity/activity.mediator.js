import { connection } from '../../db/connection.js';
import ActivitySchema from '../../db/schemas/activity.schema.js';
import CustomError from '../../utils/customError.js';
import { updateServiceHours } from '../user/user.model.js';
import {
  assignUserToActivity,
  getCompletedActivityAssignmentsById,
  updateActivity,
  updateActivityInAllAssignments,
} from './activity.model.js';

const assignUserToActivityMediator = async ({
  idUser,
  idActivity,
  completed,
  activity,
  sessionTransaction,
  preventCommit = false,
}) => {
  const session = sessionTransaction ?? (await connection.startSession());
  try {
    session.startTransaction();

    const result = await assignUserToActivity({
      idUser,
      idActivity,
      completed,
      activity,
      session,
    });

    const {
      activity: {
        serviceHours,
        asigboArea: { _id: asigboAreaId },
      },
      completed: completedValue,
    } = result;

    // si es una actividad completada, modificar total de horas de servicio
    if (completedValue === true && serviceHours > 0) {
      await updateServiceHours({
        userId: idUser,
        asigboAreaId,
        hoursToAdd: serviceHours,
        session,
      });
    }

    if (!preventCommit) await session.commitTransaction();
    return result;
  } catch (ex) {
    await session.abortTransaction();

    throw ex;
  }
};

const assignManyUsersToActivityMediator = async ({ idUsersList, idActivity, completed }) => {
  // obtener datos de actividad
  const activity = await ActivitySchema.findOne({ _id: idActivity });

  if (activity === null) throw new CustomError('La actividad proporcionada no existe.', 400);

  const session = await connection.startSession();
  try {
    session.startTransaction();

    // Asignar a todos los usuarios.
    const promises = [];
    idUsersList.forEach((idUser) => {
      const promise = assignUserToActivity({
        idUser,
        completed,
        activity,
        transactionSession: session,
        preventCommit: true,
      });
      promises.push(promise);
    });

    const results = await Promise.all(promises);

    await session.commitTransaction();
    return results;
  } catch (ex) {
    await session.abortTransaction();
    throw ex;
  }
};

const updateActivityMediator = async ({
  id,
  name,
  date,
  serviceHours,
  responsible,
  idAsigboArea,
  payment,
  registrationStartDate,
  registrationEndDate,
  participatingPromotions,
  participantsNumber,
}) => {
  const session = await connection.startSession();

  try {
    session.startTransaction();
    const { updatedData, dataBeforeChange } = await updateActivity({
      session,
      id,
      name,
      date,
      serviceHours,
      responsible,
      idAsigboArea,
      payment,
      registrationStartDate,
      registrationEndDate,
      participatingPromotions,
      participantsNumber,
    });

    // actualizar actividad en asignaciones
    if (
      updatedData.name !== dataBeforeChange.name
      || updatedData.date !== dataBeforeChange.date
      || updatedData.serviceHours !== dataBeforeChange.serviceHours
      || updatedData.asigboArea.id !== dataBeforeChange.asigboArea.id
    ) {
      await updateActivityInAllAssignments({ activity: { ...updatedData, _id: updatedData.id }, session });
    }

    // actualizar horas de servicio en usuario
    if (updatedData.serviceHours !== dataBeforeChange.serviceHours) {
      const completedAssignments = await getCompletedActivityAssignmentsById(updatedData.id);

      // Modificar valor para cada usuario
      const promises = [];
      completedAssignments?.forEach((assignment) => {
        const userId = assignment.user._id;

        promises.push(
          updateServiceHours({
            userId,
            asigboAreaId: updatedData.asigboArea.id,
            hoursToRemove: dataBeforeChange.serviceHours,
            hoursToAdd: updatedData.serviceHours,
            session,
          }),
        );
      });

      Promise.all(promises);
    }

    // modificar el monto del pago o eliminarlo (pendiente)

    await session.commitTransaction();

    return updatedData;
  } catch (ex) {
    await session.abortTransaction();

    throw ex;
  }
};

export { updateActivityMediator, assignUserToActivityMediator, assignManyUsersToActivityMediator };
