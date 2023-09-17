import yup from 'yup';

export default yup.object().shape({
  completed: yup.bool().nullable().typeError("El campo 'completed' debe ser un valor booleano.")
});
