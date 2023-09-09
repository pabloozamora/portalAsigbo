import AsigboAreaSchema from '../../db/schemas/asigboArea.schema.js';
import UserSchema from '../../db/schemas/user.schema.js';
import ActivitySchema from '../../db/schemas/activity.schema.js';
import CustomError from '../../utils/customError.js';
import { single } from './asigboArea.dto.js';
import consts from '../../utils/consts.js';

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

const assignResponsible = async ({ responsible, session }) => Promise.all(
  responsible.map(async (userId) => {
    const user = await UserSchema.findById(userId);
    if (user === null) throw new CustomError(`El usuario con id ${userId} no existe`, 404);

    user.role.push(consts.roles.asigboAreaResponsible);
    user.save({ session });
    return user;
  }),
);

const removeResponsible = async ({ responsible, session }) => Promise.all(
  responsible.map(async (userId) => {
    const user = await UserSchema.findById(userId);
    if (user === null) throw new CustomError(`El usuario con id ${userId} no existe`, 404);

    user.role = user.role.filter((role) => role !== consts.roles.asigboAreaResponsible);
    user.save({ session });
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

const deleteAsigboArea = async ({ idArea }) => {
  const area = await AsigboAreaSchema.findById(idArea);
  if (area === null) throw new CustomError('El área especificada no existe.', 404);
  if (area.blocked === true) {
    throw new CustomError('El área especificada no se encuentra activa.', 400);
  }

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
  createAsigboArea, updateAsigboArea, getActiveAreas, deleteAsigboArea, getArea,
};
