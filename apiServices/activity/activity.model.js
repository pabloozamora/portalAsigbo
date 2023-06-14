import ActivitySchema from '../../db/schemas/activity.schema.js';
import AsigboAreaSchema from '../../db/schemas/asigboArea.schema.js';
import PaymentSchema from '../../db/schemas/payment.schema.js';
import UserSchema from '../../db/schemas/user.schema.js';
import CustomError from '../../utils/customError.js';
import { single } from './activity.dto.js';

const createActivity = async ({
  name,
  date,
  serviceHours,
  responsible,
  idAsigboArea,
  idPayment,
  registrationStartDate,
  registrationEndDate,
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

  if (responsiblesData === null || responsiblesData.length === 0) throw new CustomError('No se encontraron usuarios válidos como encargados.', 400);
  if (responsiblesData.length !== responsible.length) throw new CustomError('Alguno de los encargados seleccionados no existen.', 400);

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

  const result = await activity.save();
  return single(result);
};

// eslint-disable-next-line import/prefer-default-export
export { createActivity };
