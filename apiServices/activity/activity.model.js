import ActivitySchema from '../../db/schemas/activity.schema.js';
import ActivityAssignmentSchema from '../../db/schemas/activityAssignment.schema.js';
import AsigboAreaSchema from '../../db/schemas/asigboArea.schema.js';
import PaymentSchema from '../../db/schemas/payment.schema.js';
import UserSchema from '../../db/schemas/user.schema.js';
import CustomError from '../../utils/customError.js';
import { multiple, single as singleActivityDto } from './activity.dto.js';

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
  const activity = await ActivitySchema.findOne({ _id: id, blocked: false });
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

const deleteActivity = async ({ activityId }) => {
  try {
  // verificar que no existan asignaciones a dicha actividad
    const assignments = await ActivityAssignmentSchema.find({ 'activity._id': activityId });

    if (assignments?.length > 0) throw new CustomError('No es posible eliminar, pues existen becados inscritos en la actividad.');

    const { deletedCount } = await ActivitySchema.deleteOne({ _id: activityId });

    if (deletedCount === 0) throw new CustomError('No se encontró la actividad a eliminar.', 404);
  } catch (ex) {
    if (ex?.kind === 'ObjectId') throw new CustomError('El id de la actividad no es válido.');
    throw ex;
  }
};

const getActivities = async ({ idAsigboArea, limitDate, query }) => {
  const filter = {};

  if (idAsigboArea !== undefined) filter['asigboArea._id'] = idAsigboArea;
  if (limitDate !== undefined) filter.date = { $lte: limitDate };
  if (query !== undefined) filter.name = { $regex: query, $options: 'i' };

  try {
    const result = await ActivitySchema.find(filter);

    if (result.length === 0) throw new CustomError('No se encontraron resultados.', 404);

    return multiple(result);
  } catch (ex) {
    if (ex?.kind === 'ObjectId') throw new CustomError('El id del área de asigbo no es válido.');
    if (ex?.kind === 'date') throw new CustomError('La fecha máxima no es una fecha válida.');
    throw ex;
  }
};

export {
  createActivity,
  updateActivity,
  updateActivityInAllAssignments,
  deleteActivity,
  getActivities,
};
