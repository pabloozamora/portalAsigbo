import ActivityAssignmentSchema from '../../db/schemas/activityAssignment.schema.js';
import CustomError from '../../utils/customError.js';
import exists from '../../utils/exists.js';
import Promotion from '../promotion/promotion.model.js';
import { multiple, single as singleAssignmentActivityDto } from './activityAssignment.dto.js';

const getActivityAssignments = async ({ idUser, idActivity }) => {
  try {
    const filter = {};

    if (idUser !== undefined) filter['user._id'] = idUser;
    if (idActivity !== undefined) filter['activity._id'] = idActivity;

    const assignments = await ActivityAssignmentSchema.find(filter).sort({
      'activity._id': 1,
      completed: -1,
      pendingPayment: 1,
    });
    if (assignments.length === 0) {
      throw new CustomError('No se encontraron resultados.', 404);
    }

    const parsedAssignments = multiple(assignments);
    const promotion = new Promotion();

    return await Promise.all(
      parsedAssignments.map(async (assignment) => {
        // Agregar grupo de promoción al usuario
        const copy = assignment;
        copy.user.promotionGroup = await promotion.getPromotionGroup(assignment.user.promotion);
        return copy;
      }),
    );
  } catch (ex) {
    if (ex?.kind === 'ObjectId') {
      throw new CustomError('Los ids proporcionados no son válidos.', 400);
    }
    throw ex;
  }
};

const assignUserToActivity = async ({
  user, completed, activity, session,
}) => {
  try {
    const activityAssignment = new ActivityAssignmentSchema();

    activityAssignment.user = user;
    activityAssignment.activity = activity;
    activityAssignment.pendingPayment = activity.payment !== null;
    activityAssignment.completed = completed ?? false;

    await activityAssignment.save({ session });
  } catch (ex) {
    if (ex?.code === 11000) {
      // indice duplicado
      throw new CustomError('El usuario ya se encuentra inscrito en la actividad.', 400);
    }
    throw ex;
  }
};

/**
 * Permite asignar a varios usuarios a una actividad de forma simultánea.
 * @param assignmentsList Array of objects. Los objetos del arreglo deben tener la forma
 * {user: objeto del usuario, activity: objeto de la actividad, pendingPayment: boolean, completed: boolean}
 */
const assignManyUsersToActivity = async ({ assignmentsList, session }) => {
  try {
    await ActivityAssignmentSchema.insertMany(assignmentsList, { session });
  } catch (ex) {
    if (ex?.code === 11000) {
      // indice duplicado
      throw new CustomError(
        'Alguno de los usuarios ya se encuentra inscrito en la actividad.',
        400,
      );
    }
    throw ex;
  }
};

const getCompletedActivityAssignmentsById = async (id) => ActivityAssignmentSchema.find({ 'activity._id': id, completed: true });

const unassignUserFromActivity = async ({ idActivity, idUser, session }) => {
  const assignmentData = await ActivityAssignmentSchema.findOneAndDelete(
    { 'user._id': idUser, 'activity._id': idActivity },
    { session },
  );

  if (!assignmentData) { throw new CustomError('El usuario no se encuentra inscrito en la actividad.', 403); }

  return singleAssignmentActivityDto(assignmentData);
};

/**
 * Permite modificar el estado de completado de la asignación a la actividad.
 * @param {idUser, idActivity, completed, session}
 * @returns ActivityAssignment object. Datos de la asignación previo a la modificación.
 */
const updateActivityAssignment = async ({
  idUser, idActivity, completed, session,
}) => {
  const dataToUpdate = {};

  if (exists(completed)) dataToUpdate.completed = completed;

  const assignmentData = await ActivityAssignmentSchema.findOneAndUpdate(
    { 'user._id': idUser, 'activity._id': idActivity },
    dataToUpdate,
    { session },
  );

  if (assignmentData === null) {
    throw new CustomError('El usuario no se encuentra inscrito en la actividad.', 404);
  }

  return singleAssignmentActivityDto(assignmentData);
};

export {
  assignUserToActivity,
  getCompletedActivityAssignmentsById,
  getActivityAssignments,
  unassignUserFromActivity,
  updateActivityAssignment,
  assignManyUsersToActivity,
};
