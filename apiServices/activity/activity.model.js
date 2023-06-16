import { connection } from '../../db/connection.js';
import ActivitySchema from '../../db/schemas/activity.schema.js';
import ActivityAssignmentSchema from '../../db/schemas/activityAssignment.schema.js';
import AsigboAreaSchema from '../../db/schemas/asigboArea.schema.js';
import PaymentSchema from '../../db/schemas/payment.schema.js';
import UserSchema from '../../db/schemas/user.schema.js';
import CustomError from '../../utils/customError.js';
import { single as singleActivityDto } from './activity.dto.js';
import { single as singleAssignmentActivityDto } from './activityAssignment.dto.js';

const getUserActivities = async (idUser) => {
  const user = await UserSchema.findById(idUser);
  if (user === null) throw new CustomError('El usuario indicado no existe.', 404);

  const assignments = await ActivityAssignmentSchema.find({ 'user._id': idUser });
  if (assignments.length === 0) throw new CustomError('El usuario indicado no ha paraticipado en ninguna actividad', 404);

  const activities = [];

  await Promise.all(assignments.map(async (assignment) => {
    const activity = await ActivitySchema.findById(assignment.activity._id);
    activities.push(activity);
  }));

  return activities;
};

const createActivity = async ({
  name,
  date,
  serviceHours,
  responsible,
  idAsigboArea,
  idPayment,
  registrationStartDate,
  registrationEndDate,
  participatingPromotions,
}) => {
  // obtener datos de area asigbo
  const asigboAreaData = await AsigboAreaSchema.findOne({ _id: idAsigboArea });

  if (asigboAreaData === null) throw new CustomError('No existe el área de asigbo.', 400);

  // obtener datos del pago (si existe)
  let paymentData = null;
  if (idPayment) {
    paymentData = await PaymentSchema.findOne({ _id: idPayment });

    if (paymentData === null) throw new CustomError('No existe el pago indicado.', 400);
  }

  // obtener datos de encargados
  const responsiblesData = await UserSchema.find({ _id: { $in: responsible } });

  if (responsiblesData === null || responsiblesData.length === 0) {
    throw new CustomError('No se encontraron usuarios válidos como encargados.', 400);
  }
  if (responsiblesData.length !== responsible.length) {
    throw new CustomError('Alguno de los encargados seleccionados no existen.', 400);
  }

  // guardar actividad
  const activity = new ActivitySchema();
  activity.name = name;
  activity.date = new Date(date);
  activity.serviceHours = serviceHours;
  activity.responsible = responsiblesData;
  activity.asigboArea = asigboAreaData;
  activity.payment = paymentData;
  activity.registrationStartDate = registrationStartDate;
  activity.registrationEndDate = registrationEndDate;
  activity.participatingPromotions = participatingPromotions?.length > 0
    ? participatingPromotions : null;

  const result = await activity.save();
  return singleActivityDto(result);
};

const assignUserToActivity = async ({
  idUser, idActivity, completed, activity,
}) => {
  try {
    // obtener datos de usuario
    const userData = await UserSchema.findOne({ _id: idUser });

    if (userData === null) throw new CustomError('El usuario proporcinado no existe.', 400);

    // obtener datos de la actividad
    let activityData = activity;
    if (!activity) {
      // Si la actividad no se pasa como parámetro, buscarla
      activityData = await ActivitySchema.findOne({ _id: idActivity });

      if (activityData === null) throw new CustomError('La actividad proporcionada no existe.', 400);
    }

    const activityAssignment = new ActivityAssignmentSchema();

    activityAssignment.user = userData;
    activityAssignment.activity = activityData;
    activityAssignment.pendingPayment = activityData.payment !== null;
    activityAssignment.completed = completed ?? false;

    const result = await activityAssignment.save();
    return singleAssignmentActivityDto(result);
  } catch (ex) {
    if (ex?.code === 11000) {
      // indice duplicado
      throw new CustomError('El usuario ya se encuentra inscrito en la actividad.', 400);
    }
    throw ex;
  }
};

const assignManyUsersToActivity = async ({ idUsersList, idActivity, completed }) => {
  // obtener datos de actividad
  const activity = await ActivitySchema.findOne({ _id: idActivity });

  if (activity === null) throw new CustomError('La actividad proporcionada no existe.', 400);

  const session = await connection.startSession();
  try {
    session.startTransaction();

    // Asignar a todos los usuarios.
    const promises = [];
    idUsersList.forEach((idUser) => {
      const promise = assignUserToActivity({ idUser, completed, activity });
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

// eslint-disable-next-line import/prefer-default-export
export {
  createActivity, assignUserToActivity, assignManyUsersToActivity, getUserActivities,
};
