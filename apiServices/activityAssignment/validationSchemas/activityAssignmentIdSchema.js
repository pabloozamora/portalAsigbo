import yup from 'yup';
import validateId from '../../../utils/validateId.js';

export default yup.object().shape({
  idActivityAssignment: yup
    .string()
    .nullable()
    .required("El campo 'idActivityAssignment' es obligatorio.")
    .test('validate-id', "El campo 'idActivityAssignment' no es un id válido.", (id) => validateId(id)),
});
