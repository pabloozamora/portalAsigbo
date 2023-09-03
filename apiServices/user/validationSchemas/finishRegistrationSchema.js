import * as yup from 'yup';

export default yup.object().shape({
  password: yup
    .string()
    .required('Debes ingresar tu contraseña.')
    .test('min-length', 'Debes ingresar tu contraseña.', (value) => value?.length > 0),
});
