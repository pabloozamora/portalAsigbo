import yup from 'yup';
import validateId from '../../../utils/validateId.js';
import consts from '../../../utils/consts.js';

export default yup.object().shape({
  participantsNumber: yup
    .number()
    .nullable()
    .typeError("El campo 'participantsNumber' debe ser un número.")
    .integer("El campo 'participantsNumber' debe ser un número entero.")
    .min(0, "El campo 'participantsNumber' debe contener valores mayores o iguales a 0."),
  participatingPromotions: yup
    .array()
    .of(
      yup.lazy((value) => {
        if (!Number.isNaN(parseInt(value, 10))) {
          return yup
            .number()
            .nullable()
            .integer("El campo 'participatingPromotions' debe contener solo números enteros.")
            .min(2000, "El campo 'participatingPromotions' debe contener valores mayores o iguales a 2000")
            .max(2100, "El campo 'participatingPromotions' debe contener valores menores o iguales a 2100");
        }
        return yup
          .string()
          .oneOf(Object.values(consts.promotionsGroups), "El campo 'participatingPromotions' contiene valores no numéricos que no corresponden a un grupo de promociones.");
      }),
    )
    .typeError("El campo 'participatingPromotions' debe ser una lista."),
  registrationEndDate: yup
    .date()
    .typeError("El campo 'registrationEndDate' debe ser una fecha.")
    .nullable(),
  registrationStartDate: yup
    .date()
    .typeError("El campo 'registrationStartDate' debe ser una fecha.")
    .nullable(),
  paymentAmount: yup
    .number()
    .nullable()
    .typeError("El campo 'paymentAmount' debe ser un número.")
    .min(0, "El campo 'paymentAmount' debe ser mayor o igual a 0."),
  responsible: yup
    .array()
    .of(
      yup
        .string()
        .test('validate-id', "El campo 'responsible' debe contener id's válidos.", (id) => validateId(id)),
    )
    .min(1, "El campo 'responsible' debe tener al menos un elemento.")
    .nullable()
    .typeError("El campo 'responsible' debe ser una lista."),
  serviceHours: yup
    .number()
    .nullable()
    .typeError("El campo 'serviceHours' debe ser un número.")
    .integer("El campo 'serviceHours' debe ser un número entero.")
    .min(0, "El campo 'serviceHours' debe ser mayor o igual a 0.")
    .max(200, "El campo 'serviceHours' debe ser menor o igual a 200."),
  date: yup
    .date()
    .typeError("El campo 'date' debe ser una fecha.")
    .nullable(),
  name: yup.string().nullable(),
  id: yup.string().nullable().required("El campo 'id' es obligatorio."),
});
