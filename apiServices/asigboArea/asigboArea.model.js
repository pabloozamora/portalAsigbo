import AsigboAreaSchema from '../../db/schemas/asigboArea.schema.js';
import UserSchema from '../../db/schemas/user.schema.js';
import ActivitySchema from '../../db/schemas/activity.schema.js';
import CustomError from '../../utils/customError.js';
import { single } from './asigboArea.dto.js';

const updateRoles = async (users) => {
  await Promise.all(
    users.map(async (idUser) => {
      const user = await UserSchema.findById(idUser);
      const areasInCharge = await AsigboAreaSchema.find({ 'responsible._id': idUser });

      if (areasInCharge.length === 1) user.role = user.role.filter((r) => r !== 'encargado');
      user.save();
    }),
  );
};

const updateAsigboArea = async ({ idArea, name }) => {
  try {
    const area = await AsigboAreaSchema.findById(idArea);
    if (area === null) throw new CustomError('El área de asigbo especificada no existe.', 404);

    area.name = name.trim();

    await area.save();
    return area;
  } catch (ex) {
    if (ex.code === 11000 && ex.keyValue?.name !== undefined) { throw new CustomError('El nombre proporcionado ya existe.', 400); }
    throw ex;
  }
};

const removeResponsible = async ({ idArea, idUser }) => {
  const area = await AsigboAreaSchema.findById(idArea);
  if (area === null) throw new CustomError('El área de asigbo especificada no existe.', 404);
  const user = await UserSchema.findById(idUser);
  if (user === null) throw new CustomError('El usuario especificado no existe.', 404);
  if (!user.role.includes('encargado')) { throw new CustomError('El usuario indicado no es encargado de área.'); }

  // Areas bajo la responsabilidad del usuario indicado.
  const areasInCharge = await AsigboAreaSchema.find({ 'responsible._id': idUser });

  if (!areasInCharge.some((aic) => aic._id.toString() === idArea)) { throw new CustomError('El usuario indicado no es encargado de esta área.'); }

  area.responsible = area.responsible.filter((resp) => resp._id.toString() !== idUser);
  if (areasInCharge.length === 1) user.role = user.role.filter((r) => r !== 'encargado');

  area.save();
  user.save();
  return area;
};

const addResponsible = async ({ idArea, idUser }) => {
  const area = await AsigboAreaSchema.findById(idArea);
  if (area === null) throw new CustomError('El área de asigbo especificada no existe.', 404);
  const user = await UserSchema.findById(idUser);
  if (user === null) throw new CustomError('El usuario especificado no existe.', 404);

  if (area.responsible.some((resp) => resp._id.toString() === idUser)) { throw new CustomError('El usuario ya es encargado de esta área', 400); }

  area.responsible.push(user);
  if (!user.role.includes('encargado')) user.role.push('encargado');
  area.save();
  user.save();
  return area;
};

const createAsigboArea = async ({ name, responsible, session }) => {
  try {
    const users = [];
    // añadir permisos de encargado a los usuarios
    await Promise.all(
      responsible.map(async (userId) => {
        const user = await UserSchema.findById(userId);
        if (user === null) throw new CustomError(`El usuario con id ${userId} no existe`, 404);
        users.push(user);
        user.role.push('encargado');
        user.save({ session });
        return true;
      }),
    );

    const area = new AsigboAreaSchema();

    area.name = name.trim();
    area.responsible = users;

    await area.save({ session });
    return single(area);
  } catch (ex) {
    if (ex.code === 11000 && ex.keyValue?.name !== undefined) { throw new CustomError('El nombre proporcionado ya existe.', 400); }
    throw ex;
  }
};

const deleteAsigboArea = async ({ idArea }) => {
  const area = await AsigboAreaSchema.findById(idArea);
  if (area === null) throw new CustomError('El área especificada no existe.', 404);
  if (area.blocked === true) { throw new CustomError('El área especificada no se encuentra activa.', 400); }

  const activities = await ActivitySchema.find({ 'asigboArea._id': idArea });
  const responsibles = area.responsible.map((resp) => resp._id);
  await updateRoles(responsibles);

  if (activities.length > 0) {
    activities.forEach((act) => {
      // eslint-disable-next-line no-param-reassign
      act.blocked = true;
      act.save();
    });
  }

  area.blocked = true;
  area.save();
  return area;
};

const getActiveAreas = async () => {
  const asigboAreas = await AsigboAreaSchema.find({ blocked: false });
  if (asigboAreas.length === 0) throw new CustomError('No se han encontrado áreas activas.', 404);
  return asigboAreas;
};

const getArea = async ({ idArea }) => {
  try {
    const result = await AsigboAreaSchema.findById(idArea);
    if (result === null) { throw new CustomError('No se encontró la información del área proporcionada.', 404); }
    return result;
  } catch (ex) {
    if (ex?.kind === 'ObjectId') throw new CustomError('No se encontró la información del área proporcionada.', 404);
    throw ex;
  }
};

export {
  createAsigboArea,
  updateAsigboArea,
  addResponsible,
  removeResponsible,
  getActiveAreas,
  deleteAsigboArea,
  getArea,
};
