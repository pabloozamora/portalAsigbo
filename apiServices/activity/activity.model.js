import ActivitySchema from '../../db/schemas/activity.schema.js';
import ActivityAssignmentSchema from '../../db/schemas/activityAssignment.schema.js';
import AsigboAreaSchema from '../../db/schemas/asigboArea.schema.js';
import PaymentSchema from '../../db/schemas/payment.schema.js';
import UserSchema from '../../db/schemas/user.schema.js';
import CustomError from '../../utils/customError.js';
import { single as singleActivityDto } from './activity.dto.js';
import { single as singleAssignmentActivityDto } from './activityAssignment.dto.js';

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
  participantsNumber,
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
  activity.participatingPromotions = participatingPromotions?.length > 0 ? participatingPromotions : null;
  activity.availableSpaces = participantsNumber;

  const result = await activity.save();
  return singleActivityDto(result);
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
      activityData = await ActivitySchema.findOne({ _id: idActivity });

      if (activityData === null) {
        throw new CustomError('La actividad proporcionada no existe.', 400);
      }
    }

    // verificar que hayan espacios disponibles
    if (!(activityData.availableSpaces > 0)) { throw new CustomError('La actividad no cuenta con espacios disponibles.', 403); }

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

const updateActivity = async ({
  session,
  id,
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
  // obtener actividad
  const activity = await ActivitySchema.findById(id);
  if (activity === null) throw new CustomError('No existe la actividad a actualizar.', 400);
  const dataBeforeChange = singleActivityDto(activity);

  // obtener datos de area asigbo
  const asigboAreaData = await AsigboAreaSchema.findOne({ _id: idAsigboArea });

  if (asigboAreaData === null) throw new CustomError('No existe el área de asigbo.', 400);

  // obtener datos de encargados
  const responsiblesData = await UserSchema.find({ _id: { $in: responsible } });

  if (responsiblesData === null || responsiblesData.length === 0) {
    throw new CustomError('No se encontraron usuarios válidos como encargados.', 400);
  }
  if (responsiblesData.length !== responsible.length) {
    throw new CustomError('Alguno de los encargados seleccionados no existen.', 400);
  }

  // realizar el cálculo de espacios disponibles
  if (participantsNumber !== undefined) {
    const registeredUsers = await ActivityAssignmentSchema.find({ 'activity._id': activity._id });

    if (registeredUsers.length > participantsNumber) {
      throw new CustomError(
        'El nuevo número de participantes en menor al número de becados que se encuentran ya inscritos.',
        400,
      );
    }

    activity.availableSpaces = participantsNumber - registeredUsers.length;
  }

  // actualizar actividad

  if (name !== undefined) activity.name = name;
  if (date !== undefined) activity.date = new Date(date);
  if (serviceHours !== undefined) activity.serviceHours = serviceHours;
  if (responsible !== undefined) activity.responsible = responsiblesData;
  if (idAsigboArea !== undefined) activity.asigboArea = asigboAreaData;
  if (idPayment !== undefined) activity.payment = idPayment;
  if (registrationStartDate !== undefined) activity.registrationStartDate = registrationStartDate;
  if (registrationEndDate !== undefined) activity.registrationEndDate = registrationEndDate;
  if (participatingPromotions !== undefined) {
    activity.participatingPromotions = participatingPromotions?.length > 0 ? participatingPromotions : null;
  }

  const result = await activity.save({ session });
  return {
    updatedData: singleActivityDto(result),
    dataBeforeChange,
  };
};

const updateActivityInAllAssignments = async ({ activity, session }) => ActivityAssignmentSchema.updateMany({ 'activity._id': activity.id }, { activity }, { session });

const getCompletedActivityAssignmentsById = async (id) => ActivityAssignmentSchema.find({ 'activity._id': id, completed: true });

export {
  createActivity,
  assignUserToActivity,
  updateActivity,
  updateActivityInAllAssignments,
  getCompletedActivityAssignmentsById,
};
