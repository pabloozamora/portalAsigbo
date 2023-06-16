import yup from 'yup';

export default yup.object().shape({
  path: yup.string().required('La ruta del archivo es obligatoria.'),
  schema: yup.string().required('Debe especificar el esquema en el que se desea importar la información.'),
});
