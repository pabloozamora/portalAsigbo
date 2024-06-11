import { connection } from '../../db/connection.js';
import consts from '../../utils/consts.js';
import CustomError from '../../utils/customError.js';
import errorSender from '../../utils/errorSender.js';
import exists from '../../utils/exists.js';
import parseBoolean from '../../utils/parseBoolean.js';
import {
  addActivityParticipants,
  getActivity,
  validateResponsible as validateActivityResponsible,
} from '../activity/activity.model.js';
import { validateResponsible as validateAreaResponsible } from '../asigboArea/asigboArea.model.js';
import { assignPaymentToUser, deletePaymentAssignment } from '../payment/payment.model.js';
import Promotion from '../promotion/promotion.model.js';
import {
  getUser,
  getUsersInList,
  updateActivitiesCompletedNumber,
  updateServiceHours,
} from '../user/user.model.js';
import {
  assignManyUsersToActivity,
  assignUserToActivity,
  getActivityAssignments,
  unassignUserFromActivity,
  updateActivityAssignment,
} from './activityAssignment.model.js';

const validateActivityResponsibleAccess = async ({
  role, idUser, idArea, idActivity,
}) => {
  if (role.includes(consts.roles.admin)) return;
  if (role.includes(consts.roles.asigboAreaResponsible)) {
    const hasAccess = await validateAreaResponsible({ idUser, idArea, preventError: true });
    if (hasAccess) return;
  }
  if (role.includes(consts.roles.activityResponsible)) {
    const hasAccess = await validateActivityResponsible({ idUser, idActivity, preventError: true });
    if (hasAccess) return;
  }

  throw new CustomError(
    'El usuario no figura como encargado de esta actividad ni del área al que pertenece.',
    403,
  );
};

const getActivitiesAssigmentsController = async (req, res) => {
  const {
    idUser, search, lowerDate, upperDate, page,
  } = req.query;
  const { id: sessionUserId, role } = req.session;

  // Si no es  admin, busca solo asignaciones del usuario
  const idUserFilter = role.includes(consts.roles.admin) ? idUser : sessionUserId;
  try {
    let pagesNumber = null;
    if (exists(page)) {
      // Obtener número total de resultados si se selecciona página
      const completeResult = await getActivityAssignments({
        idUser: idUserFilter,
        search,
        lowerDate,
        upperDate,
      });
      pagesNumber = completeResult.length;
    }

    const result = await getActivityAssignments({
      idUser: idUserFilter,
      search,
      lowerDate,
      upperDate,
      page,
    });

    res.send({
      pages: Math.ceil((pagesNumber ?? result.length) / consts.resultsNumberPerPage),
      resultsPerPage: consts.resultsNumberPerPage,
      result,
    });
  } catch (ex) {
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al obtener las asignaciones a actividades.',
    });
  }
};

const getActivitiesAssigmentsByActivityController = async (req, res) => {
  const { idActivity } = req.params;
  try {
    const activities = await getActivityAssignments({ idActivity });
    res.send(activities);
  } catch (ex) {
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al obtener las asignaciones de la actividad.',
    });
  }
};

const getActivityAssigmentController = async (req, res) => {
  const { idActivity, idUser } = req.params;
  try {
    const activities = await getActivityAssignments({ idActivity, idUser });
    res.send(activities[0]);
  } catch (ex) {
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al obtener la asignación de la actividad.',
    });
  }
};

const getLoggedActivitiesController = async (req, res) => {
  try {
    const activities = await getActivityAssignments({ idUser: req.session.id });
    res.send(activities);
  } catch (ex) {
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al obtener las actividades del usuario.',
    });
  }
};

const assignUserToActivityController = async (req, res) => {
  const { idUser, idActivity } = req.params;
  const { completed } = req.body;
  const { role, id: sessionIdUser } = req.session;

  const isCurrentUser = idUser === sessionIdUser;
  const session = await connection.startSession();
  try {
    session.startTransaction();

    const activity = await getActivity({ idActivity, showSensitiveData: true });

    // Validar acceso si no se desea asignar a si mismo
    if (!isCurrentUser) {
      await validateActivityResponsibleAccess({
        role,
        idUser: sessionIdUser,
        idActivity,
        idArea: activity.asigboArea.id,
      });
    }

    // Validar que la actividad y eje estén habilitados
    if (activity.asigboArea.blocked) {
      throw new CustomError('El eje de ASIGBO correspondiente se encuentra bloqueado.', 409);
    }
    if (activity.blocked) {
      throw new CustomError('La actividad se encuentra deshabilitada.', 409);
    }

    const user = await getUser({ idUser, showSensitiveData: true });

    const promotionObj = new Promotion();
    const userPromotionGroup = await promotionObj.getPromotionGroup(user.promotion);

    // validar que la promoción esté incluida
    if (
      activity.participatingPromotions !== null
      && !activity.participatingPromotions.includes(user.promotion)
      && !activity.participatingPromotions.includes(userPromotionGroup)
    ) {
      throw new CustomError('La actividad no está disponible para la promoción del usuario.');
    }

    // verificar que hayan espacios disponibles
    if (activity.participantsNumber >= activity.maxParticipants) {
      throw new CustomError('La actividad no cuenta con suficientes espacios disponibles.', 403);
    }

    // Asignar pago a usuario (si corresponde)
    let paymentAssignment = null;
    if (activity.payment) {
      paymentAssignment = await assignPaymentToUser({ user, payment: activity.payment, session });
    }

    await assignUserToActivity({
      user,
      completed,
      activity,
      paymentAssignment,
      session,
    });

    // Añadir un participante
    await addActivityParticipants({ idActivity, value: 1, session });

    const {
      serviceHours,
      asigboArea: { id: asigboAreaId },
    } = activity;

    // si es una actividad completada, modificar total de horas de servicio
    if (parseBoolean(completed) === true && serviceHours > 0) {
      await updateServiceHours({
        userId: idUser,
        asigboAreaId,
        hoursToAdd: serviceHours,
        session,
      });
    }

    // Aumentar en 1 la cantidad de activ. completadas
    if (parseBoolean(completed)) {
      await updateActivitiesCompletedNumber({ idUser, add: 1, session });
    }

    await session.commitTransaction();

    res.sendStatus(204);
  } catch (ex) {
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al asignar usuarios a una actividad.', session,
    });
  } finally {
    session.endSession();
  }
};

const assignManyUsersToActivityController = async (req, res) => {
  const { idUsersList, idActivity, completed } = req.body;
  const session = await connection.startSession();
  try {
    session.startTransaction();

    const activity = await getActivity({ idActivity, showSensitiveData: true });

    // Validar que la actividad y eje estén habilitados
    if (activity.asigboArea.blocked) {
      throw new CustomError('El eje de ASIGBO correspondiente se encuentra bloqueado.', 409);
    }
    if (activity.blocked) {
      throw new CustomError('La actividad se encuentra deshabilitada.', 409);
    }

    const users = await getUsersInList({ idUsersList, showSensitiveData: true });

    // Asignar a todos los usuarios.
    const assignmentsList = [];
    const promotionObj = new Promotion();

    await Promise.all(
      idUsersList.forEach(async (idUser) => {
        const user = users.find((u) => u.id === idUser);

        const userPromotionGroup = await promotionObj.getPromotionGroup(user.promotion);

        // validar que la promoción esté incluida
        if (
          activity.participatingPromotions !== null
          && !activity.participatingPromotions.includes(user.promotion)
          && !activity.participatingPromotions.includes(userPromotionGroup)
        ) {
          throw new CustomError(
            `La actividad no está disponible para la promoción del usuario ${user.name} ${user.lastname}.`,
          );
        }

        const availableSpaces = activity.maxParticipants - activity.participantsNumber;
        // verificar que hayan espacios disponibles
        if (availableSpaces < users.length) {
          throw new CustomError(
            'La actividad no cuenta con suficientes espacios disponibles.',
            403,
          );
        }

        assignmentsList.push({ user, activity, completed });
      }),
    );

    await assignManyUsersToActivity({ assignmentsList, session });

    // Añadir x cantidad de participantes
    await addActivityParticipants({ idActivity, value: users.length, session });

    await session.commitTransaction();

    res.sendStatus(204);
  } catch (ex) {
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al asignar lista de usuarios a una actividad.', session,
    });
  } finally {
    session.endSession();
  }
};

const unassignUserFromActivityController = async (req, res) => {
  const { idActivity, idUser } = req.params;
  const { role, id: sessionIdUser } = req.session;

  const session = await connection.startSession();

  try {
    session.startTransaction();

    const activity = await getActivity({ idActivity, showSensitiveData: true });

    // Validar acceso
    await validateActivityResponsibleAccess({
      role,
      idUser: sessionIdUser,
      idActivity,
      idArea: activity.asigboArea.id,
    });

    // Validar que la actividad y eje estén habilitados
    if (activity.asigboArea.blocked) {
      throw new CustomError('El eje de ASIGBO correspondiente se encuentra bloqueado.', 409);
    }
    if (activity.blocked) {
      throw new CustomError('La actividad se encuentra deshabilitada.', 409);
    }

    const result = await unassignUserFromActivity({ idActivity, idUser, session });
    const {
      activity: {
        serviceHours,
        asigboArea: { _id: asigboAreaId },
      },
      completed,
    } = result;

    // Remover participantes en la actividad
    await addActivityParticipants({ idActivity, value: -1, session });

    // si es una actividad completada, modificar total de horas de servicio
    if (completed === true && serviceHours > 0) {
      await updateServiceHours({
        userId: idUser,
        asigboAreaId,
        hoursToRemove: serviceHours,
        session,
      });
    }

    // Reducir en 1 la cantidad de activ. completadas
    if (parseBoolean(completed)) {
      await updateActivitiesCompletedNumber({ idUser, remove: 1, session });
    }

    // Si existe un pago en la actividad, eliminar asignación (si no fue completado el pago aún)
    if (activity.payment) {
      await deletePaymentAssignment({ idUser, idPayment: activity.payment.id, session });
    }

    await session.commitTransaction();

    res.sendStatus(204);
  } catch (ex) {
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al desasignar al usuario de la actividad.', session,
    });
  } finally {
    session.endSession();
  }
};

const updateActivityAssignmentController = async (req, res) => {
  const { idActivity, idUser } = req.params;
  const { completed, aditionalServiceHours } = req.body;
  const { role, id: sessionIdUser } = req.session;

  const session = await connection.startSession();

  try {
    session.startTransaction();

    const activity = await getActivity({ idActivity, showSensitiveData: true });

    // Validar acceso
    await validateActivityResponsibleAccess({
      role,
      idUser: sessionIdUser,
      idActivity,
      idArea: activity.asigboArea.id,
    });

    // Validar que la actividad y eje estén habilitados
    if (activity.asigboArea.blocked) {
      throw new CustomError('El eje de ASIGBO correspondiente se encuentra bloqueado.', 409);
    }
    if (activity.blocked) {
      throw new CustomError('La actividad se encuentra deshabilitada.', 409);
    }

    const result = await updateActivityAssignment({
      idUser,
      idActivity,
      completed,
      aditionalServiceHours,
      session,
    });

    // Valores de asignación previos a la modificación
    const {
      activity: {
        serviceHours,
        asigboArea: { _id: asigboAreaId },
      },
      completed: prevCompletedResultValue,
      aditionalServiceHours: prevAditionalServiceHours,
    } = result;

    const parsedAditionalServiceHours = exists(aditionalServiceHours)
      ? parseInt(aditionalServiceHours, 10)
      : null;

    if (exists(aditionalServiceHours) && !exists(completed) && prevCompletedResultValue) {
      // Realizar unicamente ajuste de horas adicionales para actividad completada
      const hoursToAdd = parsedAditionalServiceHours - (prevAditionalServiceHours ?? 0);
      if (hoursToAdd !== 0) {
        // Valores negativos restan al total
        await updateServiceHours({
          userId: idUser,
          asigboAreaId,
          hoursToAdd,
          session,
        });
      }
    } else if (exists(completed) && prevCompletedResultValue !== parseBoolean(completed)) {
      // Se modificó el valor completed
      if (parseBoolean(completed)) {
        // agregar horas + horas adicionales (si también se modificaron, utilizar valor nuevo)
        const hoursToAdd = serviceHours + (parsedAditionalServiceHours ?? prevAditionalServiceHours ?? 0);
        if (hoursToAdd > 0) {
          await updateServiceHours({
            userId: idUser,
            asigboAreaId,
            hoursToAdd,
            session,
          });
        }

        // Aumentar en 1 la cantidad de activ. completadas
        await updateActivitiesCompletedNumber({ idUser, add: 1, session });
      } else {
        // remover horas + horas adicionales previas (sin importar que se haya actualizado)
        const hoursToRemove = serviceHours + (prevAditionalServiceHours ?? 0);
        if (hoursToRemove > 0) {
          await updateServiceHours({
            userId: idUser,
            asigboAreaId,
            hoursToRemove,
            session,
          });
        }

        // Reducir en 1 la cantidad de activ. completadas
        await updateActivitiesCompletedNumber({ idUser, remove: 1, session });
      }
    }

    await session.commitTransaction();

    res.sendStatus(204);
  } catch (ex) {
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al actualizar la asignación de la actividad.', session,
    });
  } finally {
    session.endSession();
  }
};

export {
  assignUserToActivityController,
  assignManyUsersToActivityController,
  getActivitiesAssigmentsByActivityController,
  getLoggedActivitiesController,
  unassignUserFromActivityController,
  updateActivityAssignmentController,
  getActivitiesAssigmentsController,
  getActivityAssigmentController,
};
