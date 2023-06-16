import helper from 'csvtojson';
import sha256 from 'js-sha256';
import CustomError from '../../utils/customError.js';
import { generateUsers } from './uploadData.model.js';

const uploadDataController = async (req, res) => {
  const { schema, path } = req.body;

  try {
    const data = [];

    switch (schema) {
      case 'user':
        await helper().fromFile(path, { encoding: 'binary' }).then((rows) => {
          rows.forEach((row) => {
            const newUser = {
              code: row.code,
              name: row.name,
              lastname: row.lastname,
              email: row.email,
              promotion: row.promotion,
              sex: row.sex,
              passwordHash: sha256(row.password),
            };
            data.push(newUser);
          });
        });
        res.send(await generateUsers(data));
        break;
      default:
        throw new CustomError('El esquema especificado no existe.');
    }
  } catch (ex) {
    let err = 'Ocurrio un error al insertar la información.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

// eslint-disable-next-line import/prefer-default-export
export { uploadDataController };
