import ActivitySchema from '../../db/schemas/activity.schema.js';
import ActivityAssignmentSchema from '../../db/schemas/activityAssignment.schema.js';
import UserSchema from '../../db/schemas/user.schema.js';
import CustomError from '../../utils/customError.js';
import parseBoolean from '../../utils/parseBoolean.js';
import { multiple, single as singleAssignmentActivityDto } from './activityAssignment.dto.js';

const getActivityAssignments = async ({ idUser, idActivity }) => {
  try {
    const filter = {};

    if (idUser !== undefined) filter['user._id'] = idUser;
    if (idActivity !== undefined) filter['activity._id'] = idActivity;

    const assignments = await ActivityAssignmentSchema.find(filter);
    if (assignments.length === 0) {
      throw new CustomError('No se encontraron resultados.', 404);
    }

    return multiple(assignments);
  } catch (ex) {
    if (ex?.kind === 'ObjectId') throw new CustomError('Los ids proporcionados no son válidos.', 400);
    throw ex;
  }
};

const assignUserToActivity = async ({
  idUser, idActivity, completed, activity, session,
}) => {
  try {
    // obtener datos de usuario
    const userData = await UserSchema.findOne({ _id: idUser });

    if (userData === null) throw new CustomError('El usuario proporcinado no existe.', 400);

    // obtener datos de la actividad
    let activityData = activity;
    if (!activity) {
      // Si la actividad no se pasa como parámetro, buscarla
      activityData = await ActivitySchema.findOne({ _id: idActivity, blocked: false });

      if (activityData === null) {
        throw new CustomError('La actividad proporcionada no existe.', 400);
      }
    }

    // verificar que hayan espacios disponibles
    if (!(activityData.availableSpaces > 0)) {
      throw new CustomError('La actividad no cuenta con espacios disponibles.', 403);
    }

    // disminuir el número de vacantes
    activityData.availableSpaces -= 1;
    await activityData.save({ session });

    const activityAssignment = new ActivityAssignmentSchema();

    activityAssignment.user = userData;
    activityAssignment.activity = activityData;
    activityAssignment.pendingPayment = activityData.payment !== null;
    activityAssignment.completed = completed ?? false;

    const result = await activityAssignment.save({ session });

    return singleAssignmentActivityDto(result);
  } catch (ex) {
    if (ex?.code === 11000) {
      // indice duplicado
      throw new CustomError('El usuario ya se encuentra inscrito en la actividad.', 400);
    }
    throw ex;
  }
};

const getCompletedActivityAssignmentsById = async (id) => ActivityAssignmentSchema.find({ 'activity._id': id, completed: true });

const unassignUserFromActivity = async ({ idActivityAssignment, session }) => {
  const assignmentData = await ActivityAssignmentSchema.findById(idActivityAssignment);

  if (assignmentData === null) {
    throw new CustomError('El usuario no se encuentra inscrito en la actividad.', 403);
  }

  const { deletedCount } = await ActivityAssignmentSchema.deleteOne(
    {
      _id: idActivityAssignment,
    },
    { session },
  );

  if (deletedCount !== 1) throw new CustomError('No se encontró la asignación a eliminar.', 404);

  return singleAssignmentActivityDto(assignmentData);
};

/**
 * Permite modificar el estado de completado de la asignación a la actividad.
 * @param {idUser, idActivity, completed, session}
 * @returns ActivityAssignment object.
 */
const changeActivityAssignmentCompletionStatus = async ({
  idActivityAssignment,
  completed,
  session,
}) => {
  const assignmentData = await ActivityAssignmentSchema.findById(idActivityAssignment);

  if (assignmentData === null) {
    throw new CustomError('El usuario no se encuentra inscrito en la actividad.', 404);
  }

  if (assignmentData.completed === parseBoolean(completed)) {
    throw new CustomError(
      assignmentData.completed
        ? 'El status de la actividad ya ha sido completado.'
        : 'El status de completado de la actividad ya ha sido retirado.',
      400,
    );
  }

  assignmentData.completed = parseBoolean(completed);

  const result = await assignmentData.save({ session });

  return singleAssignmentActivityDto(result);
};

export {
  assignUserToActivity,
  getCompletedActivityAssignmentsById,
  getActivityAssignments,
  unassignUserFromActivity,
  changeActivityAssignmentCompletionStatus,
};
