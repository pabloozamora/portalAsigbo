import * as yup from 'yup';

const userSchema = yup.object().shape({
  sex: yup
    .string()
    .matches(/^[MF]$/, ({ value }) => `El campo 'sexo' debe ser 'M' o 'F'. Valor recibido: '${value}'`)
    .required("El campo 'sexo' es obligatorio  para todos los usuarios."),

  campus: yup
    .string()
    .required("El campo 'campus' es obligatorio para todos los usuarios."),

  university: yup
    .string()
    .required("El campo 'universidad' es obligatorio para todos los usuarios."),

  career: yup
    .string()
    .required("El campo 'carrera' es obligatorio para todos los usuarios."),

  promotion: yup
    .number()
    .nullable()
    .typeError("El campo 'promoción' debe ser un número.")
    .integer("El campo 'promoción' debe ser un número entero.")
    .min(2000, ({ value }) => `El campo 'promoción' debe ser mayor a 2000. Valor recibido: '${value}.'`)
    .max(2100, ({ value }) => `El campo 'promoción' debe ser menor o igual a 2100. Valor recibido: '${value}.'`)
    .required("El campo 'promoción' es obligatorio para todos los usuarios."),

  email: yup
    .string()
    .nullable()
    .email(({ value }) => `El email '${value}' no posee un formato válido`)
    .required("El campo 'email' es obligatorio"),

  lastname: yup
    .string()
    .required("El campo 'apellido' es obligatorio"),

  name: yup
    .string()
    .required("El campo 'nombre' es obligatorio"),
});

export default yup.object().shape({
  data: yup
    .array()
    .of(userSchema)
    .required('Debe ingresar el arreglo con la información a importar'),

  sendEmail: yup
    .bool()
    .nullable()
    .typeError("El campo 'sendEmail' debe ser un valor booleano"),
});
