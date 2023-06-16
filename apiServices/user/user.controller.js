import sha256 from 'js-sha256';
import CustomError from '../../utils/customError.js';
import { multiple, single } from './user.dto.js';
import { createUser, getActiveUsers, getUser } from './user.model.js';

const getLoggedUserController = async (req, res) => {
  try {
    const user = await getUser(req.session.id);
    res.send(single(user, false, true));
  } catch (ex) {
    let err = 'Ocurrio un error al obtener la información del usuario.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const getUserController = async (req, res) => {
  const { idUser } = req.query || null;
  try {
    const user = await getUser(idUser);
    res.send(single(user, false, true));
  } catch (ex) {
    let err = 'Ocurrio un error al obtener la información del usuario.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

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

export {
  createUserController, getActiveUsersController, getUserController, getLoggedUserController,
};
