import AsigboAreaSchema from '../../db/schemas/asigboArea.schema.js';
import UserSchema from '../../db/schemas/user.schema.js';
import CustomError from '../../utils/customError.js';

const updateAsigboArea = async ({
  idArea, name,
}) => {
  try {
    const area = await AsigboAreaSchema.findById(idArea);
    if (area === null) throw new CustomError('El área de asigbo especificada no existe.', 404);

    area.name = name.trim();

    await area.save();
    return area;
  } catch (ex) {
    if (ex.code === 11000 && ex.keyValue?.name !== undefined) throw new CustomError('El nombre proporcionado ya existe.', 400);
    throw ex;
  }
};

const addResponsible = async ({
  idArea, idUser,
}) => {
  const area = await AsigboAreaSchema.findById(idArea);
  if (area === null) throw new CustomError('El área de asigbo especificada no existe.', 404);
  const user = await UserSchema.findById(idUser);
  if (user === null) throw new CustomError('El usuario especificado no existe.', 404);

  if (user in area.responsible) throw new CustomError('El usuario ya es encargado de esta área', 400);

  area.responsible.push(user);
  user.role.push('encargado');
  area.save();
  user.save();
  return area;
};

const createAsigboArea = async ({
  name, responsible,
}) => {
  try {
    const users = [];
    await Promise.all(responsible.map(async (userId) => {
      const user = await UserSchema.findById(userId);
      if (user === null) throw new CustomError(`El usuario con id ${userId} no existe`, 404);
      users.push(user);
      user.role.push('encargado');
      user.save();
      return true;
    }));
    const area = new AsigboAreaSchema();

    area.name = name.trim();
    area.responsible = users;

    await area.save();
    return area;
  } catch (ex) {
    if (ex.code === 11000 && ex.keyValue?.name !== undefined) throw new CustomError('El nombre proporcionado ya existe.', 400);
    throw ex;
  }
};

export { createAsigboArea, updateAsigboArea, addResponsible };
