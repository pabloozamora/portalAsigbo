import sha256 from 'js-sha256';
import CustomError from '../../utils/customError.js';
import { multiple, single } from './user.dto.js';
import {
  createUser, getActiveUsers, getUser, saveRegisterToken,
} from './user.model.js';
import { connection } from '../../db/connection.js';
import { signRegisterToken } from '../../services/jwt.js';
import NewUserEmail from '../../services/email/NewUserEmail.js';

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
  const { idUser } = req.params || null;
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
    code, name, lastname, email, promotion, career, password, sex,
  } = req.body;

  const session = await connection.startSession();

  try {
    session.startTransaction();

    const passwordHash = sha256(password);

    const user = await createUser({
      code,
      name,
      lastname,
      email,
      promotion,
      career,
      passwordHash,
      sex,
      session,
    });

    // guardar token para completar registro
    const token = signRegisterToken({ id: user.id, name: user.name, lastname: user.lastname });
    await saveRegisterToken({ idUser: user.id, token, session });

    // enviar email de notificación
    const emailSender = new NewUserEmail({ addresseeEmail: email, name, registerToken: token });
    emailSender.sendEmail();

    await session.commitTransaction();

    res.send(user);
  } catch (ex) {
    await session.abortTransaction();

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
  createUserController,
  getActiveUsersController,
  getUserController,
  getLoggedUserController,
};
