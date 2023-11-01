import yup from 'yup';

export default yup.object().shape({
  data: yup.array().required('Debe ingresar el arreglo con la información a importar.'),
});
