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

const createAsigboArea = async ({
  name, responsible,
}) => {
  try {
    const users = [];
    await Promise.all(responsible.map(async (userId) => {
      const user = await UserSchema.findById(userId);
      if (user === null) throw new CustomError(`El usuario con id ${userId} no existe`, 404);
      users.push(user);
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

export { createAsigboArea, updateAsigboArea };
