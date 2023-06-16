import sha256 from 'js-sha256';
import CustomError from '../../utils/customError.js';
import { multiple, single } from './user.dto.js';
import { createUser, getActiveUsers } from './user.model.js';

const createUserController = async (req, res) => {
  const {
    code, name, lastname, email, promotion, password, sex,
  } = req.body;

  try {
    const passwordHash = sha256(password);

    const user = await createUser({
      code, name, lastname, email, promotion, passwordHash, sex,
    });
    res.send(single(user, false));
  } catch (ex) {
    let err = 'Ocurrio un error al crear nuevo usuario.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const getActiveUsersController = async (req, res) => {
  try {
    const users = await getActiveUsers(req.session.id);
    res.send(multiple(users, false));
  } catch (ex) {
    let err = 'Ocurrio un error al obtener los usuarios activos.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

export { createUserController, getActiveUsersController };
