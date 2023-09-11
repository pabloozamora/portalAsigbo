import CustomError from '../../utils/customError.js';
import { generateUsers } from './uploadData.model.js';

const uploadDataController = async (req, res) => {
  const { data } = req.body;

  try {
    const users = data.map((user) => ({
      code: user['Código'],
      name: user.Nombres,
      lastname: user.Apellidos,
      email: user.Correo,
      promotion: user['Promoción'],
      career: user.Carrera,
      sex: user.Sexo,
    }));
    const result = await generateUsers({ users });
    res.send(result);
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
