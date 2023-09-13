import { connection } from '../../db/connection.js';
import ActivitySchema from '../../db/schemas/activity.schema.js';
import CustomError from '../../utils/customError.js';
import { updateServiceHours } from '../user/user.model.js';
import {
  assignUserToActivity,
  changeActivityAssignmentCompletionStatus,
  unassignUserFromActivity,
} from './activityAssignment.model.js';

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
        asigboArea: { id: asigboAreaId },
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

const unassignUserFromActivityMediator = async ({ idActivityAssignment }) => {
  const session = await connection.startSession();
  try {
    session.startTransaction();

    const result = await unassignUserFromActivity({ idActivityAssignment, session });
    const {
      activity: {
        serviceHours,
        asigboArea: { _id: asigboAreaId },
      },
      user: { id: idUser },
      completed,
    } = result;

    // si es una actividad completada, modificar total de horas de servicio
    if (completed === true && serviceHours > 0) {
      await updateServiceHours({
        userId: idUser,
        asigboAreaId,
        hoursToRemove: serviceHours,
        session,
      });
    }

    await session.commitTransaction();
  } catch (ex) {
    await session.abortTransaction();

    throw ex;
  }
};

const changeActivityAssignmentCompletionStatusMediator = async ({
  idActivityAssignment,
  completed,
}) => {
  const session = await connection.startSession();
  try {
    session.startTransaction();

    const result = await changeActivityAssignmentCompletionStatus({
      idActivityAssignment,
      completed,
      session,
    });
    const {
      activity: {
        serviceHours,
        asigboArea: { _id: asigboAreaId },
      },
      user: { id: idUser },
      completed: completedResult,
    } = result;

    // si es una actividad completada, modificar total de horas de servicio
    // El valor completed corresponde al nuevo valor. Si es true, se deben de agregar las horas.
    if (serviceHours > 0) {
      if (completedResult === true) {
        await updateServiceHours({
          userId: idUser,
          asigboAreaId,
          hoursToAdd: serviceHours,
          session,
        });
      } else {
        await updateServiceHours({
          userId: idUser,
          asigboAreaId,
          hoursToRemove: serviceHours,
          session,
        });
      }
    }

    await session.commitTransaction();
  } catch (ex) {
    await session.abortTransaction();

    throw ex;
  }
};

export {
  assignUserToActivityMediator,
  assignManyUsersToActivityMediator,
  unassignUserFromActivityMediator,
  changeActivityAssignmentCompletionStatusMediator,
};
