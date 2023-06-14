import AsigboAreaSchema from '../../db/schemas/asigboArea.schema.js';
import CustomError from '../../utils/customError.js';

const createAsigboArea = async ({
  name, responsible,
}) => {
  try {
    const area = new AsigboAreaSchema();

    area.name = name;
    area.responsible = responsible;

    await area.save();
    return area;
  } catch (ex) {
    if (ex.code === 11000 && ex.keyValue?.name !== undefined) throw new CustomError('El nombre proporcionado ya existe.', 400);
    throw ex;
  }
};

// eslint-disable-next-line import/prefer-default-export
export { createAsigboArea };
