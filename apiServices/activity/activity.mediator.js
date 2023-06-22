import { connection } from '../../db/connection.js';
import consts from '../../utils/consts.js';
import { getCompletedActivityAssignmentsById } from '../activityAssignment/activityAssignment.model.js';
import { addRoleToManyUsers, updateServiceHours } from '../user/user.model.js';
import {
  createActivity,
  updateActivity,
  updateActivityInAllAssignments,
} from './activity.model.js';

const createActivityMediator = async ({
  name,
  date,
  serviceHours,
  responsible,
  idAsigboArea,
  idPayment,
  registrationStartDate,
  registrationEndDate,
  participatingPromotions,
  participantsNumber,
}) => {
  const session = await connection.startSession();

  try {
    session.startTransaction();

    const activityResult = await createActivity({
      name,
      date,
      serviceHours,
      responsible,
      idAsigboArea,
      idPayment,
      registrationStartDate,
      registrationEndDate,
      participatingPromotions,
      participantsNumber,
      session,
    });

    // añadir roles de responsables de actividad

    await addRoleToManyUsers({ usersIdList: responsible, role: consts.roles.activityResponsible, session });

    await session.commitTransaction();

    return activityResult;
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
      await updateActivityInAllAssignments({
        activity: { ...updatedData, _id: updatedData.id },
        session,
      });
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

export {
  updateActivityMediator,
  createActivityMediator,
};
