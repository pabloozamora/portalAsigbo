import { connection } from '../../db/connection.js';
import { getCompletedActivityAssignmentsById } from '../activityAssignment/activityAssignment.model.js';
import { updateServiceHours } from '../user/user.model.js';
import {
  updateActivity,
  updateActivityInAllAssignments,
} from './activity.model.js';

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
  // eslint-disable-next-line import/prefer-default-export
  updateActivityMediator,
};
