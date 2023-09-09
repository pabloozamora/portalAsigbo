import AsigboAreaSchema from '../../db/schemas/asigboArea.schema.js';
import UserSchema from '../../db/schemas/user.schema.js';
import ActivitySchema from '../../db/schemas/activity.schema.js';
import CustomError from '../../utils/customError.js';
import { single } from './asigboArea.dto.js';
import consts from '../../utils/consts.js';

const assignResponsible = async ({ responsible, session }) => Promise.all(
  responsible.map(async (userId) => {
    const user = await UserSchema.findById(userId);
    if (user === null) throw new CustomError(`El usuario con id ${userId} no existe`, 404);

    if (!user.role.includes(consts.roles.asigboAreaResponsible))user.role.push(consts.roles.asigboAreaResponsible);
    user.save({ session });
    return user;
  }),
);

const removeResponsible = async ({ responsible, session }) => Promise.all(
  responsible.map(async (userId) => {
    const user = await UserSchema.findById(userId);
    if (user === null) throw new CustomError(`El usuario con id ${userId} no existe`, 404);

    // Retirar permiso si el usuario solo es encargado del area a retirar
    const areasInCharge = await AsigboAreaSchema.find({ 'responsible._id': userId });
    if (areasInCharge.length === 1) {
      user.role = user.role.filter((role) => role !== consts.roles.asigboAreaResponsible);
      user.save({ session });
    }
    return user;
  }),
);

const updateAsigboArea = async ({
  idArea, name, responsible, session,
}) => {
  try {
    const area = await AsigboAreaSchema.findById(idArea);
    if (area === null) throw new CustomError('El área de asigbo especificada no existe.', 404);

    // responsables a añadir
    const responsibleToAdd = responsible.filter(
      (userId) => !area.responsible.some((user) => user._id.toString() === userId),
    );
    const responsibleToRemove = area.responsible
      .filter((user) => !responsible.some((userId) => user._id.toString() === userId))
      .map((user) => user._id.toString());

    const responsibleUsers = await assignResponsible({ responsible: responsibleToAdd, session });
    await removeResponsible({ responsible: responsibleToRemove, session });

    area.name = name.trim();
    area.responsible = [
      ...area.responsible.filter(
        (user) => !responsibleToRemove.some((userId) => user._id.toString() === userId),
      ),
      ...responsibleUsers,
    ];

    await area.save({ session });
    return area;
  } catch (ex) {
    if (ex.code === 11000 && ex.keyValue?.name !== undefined) {
      throw new CustomError('El nombre proporcionado ya existe.', 400);
    }
    throw ex;
  }
};

const createAsigboArea = async ({ name, responsible, session }) => {
  try {
    // añadir permisos de encargado a los usuarios
    const users = await assignResponsible({ responsible, session });
    const area = new AsigboAreaSchema();

    area.name = name.trim();
    area.responsible = users;

    await area.save({ session });
    return single(area);
  } catch (ex) {
    if (ex.code === 11000 && ex.keyValue?.name !== undefined) {
      throw new CustomError('El nombre proporcionado ya existe.', 400);
    }
    throw ex;
  }
};

/**
 *
 * Permite remover los permisos de todos los responsables de un area asigbo.
 * @param idArea id del area
 * @param session objeto session de la transacción de bd
 */
const removeAsigboAreaResponsible = async ({ idArea, session }) => {
  try {
    const area = await AsigboAreaSchema.findById(idArea);

    if (area === null) throw new CustomError('No se encontró el eje a eliminar.', 404);

    const responsible = area.responsible.map((user) => user._id);
    await removeResponsible({ responsible, session });
  } catch (ex) {
    if (ex?.kind === 'ObjectId') {
      throw new CustomError('No se encontró la información del eje proporcionado.', 404);
    }
    throw ex;
  }
};

/**
 * Permite eliminar un área de asigbo. Fallará cuando esta cuente alguna actividad existente.
 * @param idArea id del area
 * @param session objeto session de la transacción de bd
 */
const deleteAsigboArea = async ({ idArea, session }) => {
  const activities = await ActivitySchema.find({ 'asigboArea._id': idArea });

  // Evitar que se elimine si posee actividades
  if (activities.length > 0) throw new CustomError('No se puede eliminar el eje, pues este contiene actividades.', 400);

  const { deletedCount } = await AsigboAreaSchema.deleteOne({ _id: idArea }, { session });

  if (deletedCount === 0) throw new CustomError('No se encontró el eje a eliminar.', 404);
};

const getActiveAreas = async () => {
  const asigboAreas = await AsigboAreaSchema.find({ blocked: false });
  if (asigboAreas.length === 0) throw new CustomError('No se han encontrado áreas activas.', 404);
  return asigboAreas;
};

const getArea = async ({ idArea }) => {
  try {
    const result = await AsigboAreaSchema.findById(idArea);
    if (result === null) {
      throw new CustomError('No se encontró la información del área proporcionada.', 404);
    }
    return result;
  } catch (ex) {
    if (ex?.kind === 'ObjectId') {
      throw new CustomError('No se encontró la información del área proporcionada.', 404);
    }
    throw ex;
  }
};

export {
  createAsigboArea, updateAsigboArea, getActiveAreas, deleteAsigboArea, getArea, removeAsigboAreaResponsible,
};
