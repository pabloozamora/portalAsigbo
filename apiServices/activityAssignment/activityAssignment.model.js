import ActivitySchema from '../../db/schemas/activity.schema.js';
import ActivityAssignmentSchema from '../../db/schemas/activityAssignment.schema.js';
import UserSchema from '../../db/schemas/user.schema.js';
import CustomError from '../../utils/customError.js';
import { multiple, single as singleAssignmentActivityDto } from './activityAssignment.dto.js';

const getUserActivities = async (idUser) => {
  try {
    const user = await UserSchema.findById(idUser);
    if (user === null) throw new CustomError('El usuario indicado no existe.', 404);

    const assignments = await ActivityAssignmentSchema.find({ 'user._id': idUser });
    if (assignments.length === 0) { throw new CustomError('El usuario indicado no ha paraticipado en ninguna actividad', 404); }

    return multiple(assignments);
  } catch (ex) {
    if (ex?.kind === 'ObjectId') throw new CustomError('El id del usuario no es válido.');
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

const unassignUserFromActivity = async ({ idUser, idActivity }) => {
  const assignmentData = await ActivityAssignmentSchema.findOne({
    'user._id': idUser,
    'activity._id': idActivity,
  });

  if (assignmentData === null) { throw new CustomError('El usuario no se encuentra inscrito en la actividad.', 403); }

  const { deletedCount } = await ActivityAssignmentSchema.deleteOne({
    'user._id': idUser,
    'activity._id': idActivity,
  });

  if (deletedCount !== 1) throw new CustomError('No se encontró la asignación a eliminar.', 404);

  return singleAssignmentActivityDto(assignmentData);
};

export {
  assignUserToActivity,
  getCompletedActivityAssignmentsById,
  getUserActivities,
  unassignUserFromActivity,
};
