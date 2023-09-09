import yup from 'yup';

export default yup.object().shape({
  name: yup.string().required('El nombre del área es obligatorio.'),
  responsible: yup
    .array()
    .of(yup.string().typeError("El campo 'responsible' debe contener cadenas."))
    .typeError("El campo 'responsible' debe ser un arreglo.")
    .min(1, 'Debe especificar al menos un responsable del área')
    .required('Debe especificar a los encargados de esta área'),
});
