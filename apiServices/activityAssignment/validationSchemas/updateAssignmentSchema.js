import yup from 'yup';

export default yup.object().shape({
  completed: yup.bool().nullable().typeError("El campo 'completed' debe ser un valor booleano."),
  aditionalServiceHours: yup
    .number()
    .nullable()
    .typeError("El campo 'aditionalServiceHours' debe ser un número.")
    .integer("El campo 'aditionalServiceHours' debe ser un número entero.")
    .min(0, "El campo 'aditionalServiceHours' debe ser mayor o igual a 0."),
});
