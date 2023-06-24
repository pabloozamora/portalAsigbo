import { connection } from '../../db/connection.js';
import consts from '../../utils/consts.js';
import { getCompletedActivityAssignmentsById } from '../activityAssignment/activityAssignment.model.js';
import { addRoleToManyUsers, removeRoleFromUser, updateServiceHours } from '../user/user.model.js';
import { single } from './activity.dto.js';
import {
  createActivity,
  deleteActivity,
  getActivitiesWhereUserIsResponsible,
  getActivity,
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

    await addRoleToManyUsers({
      usersIdList: responsible,
      role: consts.roles.activityResponsible,
      session,
    });

    await session.commitTransaction();

    return activityResult;
  } catch (ex) {
    await session.abortTransaction();
    throw ex;
  }
};

const removeActivityResponsibleRole = async ({ idUser, session }) => {
  const result = await getActivitiesWhereUserIsResponsible({ idUser });
  if (result.length === 1) {
    // La única actividad en la que es responsable es en la que se le eliminó, retirar permiso
    await removeRoleFromUser({ idUser, role: consts.roles.activityResponsible, session });
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

    // retirar permisos a responsables retirados
    const usersRemoved = dataBeforeChange.responsible.filter(
      (beforeUser) => !updatedData.responsible.some((updatedUser) => beforeUser.id === updatedUser.id),
    )
      .map((user) => user.id);
    await Promise.all(
      usersRemoved.map((idUser) => removeActivityResponsibleRole({ idUser, session })),
    );

    // añadir permisos a nuevos responsables
    const usersAdded = updatedData.responsible
      .filter(
        (updatedUser) => !dataBeforeChange.responsible.some((beforeUser) => beforeUser.id === updatedUser.id),
      )
      .map((user) => user.id);
    await addRoleToManyUsers({
      usersIdList: usersAdded,
      role: consts.roles.activityResponsible,
      session,
    });

    await session.commitTransaction();

    return single(updatedData);
  } catch (ex) {
    await session.abortTransaction();

    throw ex;
  }
};

const deleteActivityMediator = async ({ idActivity }) => {
  const { responsible } = await getActivity({ idActivity, getSensitiveData: true });

  const session = await connection.startSession();

  try {
    session.startTransaction();

    await deleteActivity({ idActivity, session });

    // retirar permisos a responsables retirados
    await Promise.all(
      responsible?.map((user) => removeActivityResponsibleRole({ idUser: user.id, session })),
    );

    await session.commitTransaction();
  } catch (ex) {
    await session.abortTransaction();
    throw ex;
  }
};

export { updateActivityMediator, createActivityMediator, deleteActivityMediator };
