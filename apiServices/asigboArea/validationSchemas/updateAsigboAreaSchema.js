import yup from 'yup';

export default yup.object().shape({
  name: yup.string().required('El nombre del área es obligatorio.'),
});
