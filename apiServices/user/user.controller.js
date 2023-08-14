import sha256 from 'js-sha256';
import fs from 'node:fs';
import CustomError from '../../utils/customError.js';
import { multiple, single } from './user.dto.js';
import {
  createUser, deleteAllUserAlterTokens, getActiveUsers, getUser, saveRegisterToken, updateUserPassword, validateAlterUserToken,
} from './user.model.js';
import { connection } from '../../db/connection.js';
import { signRegisterToken } from '../../services/jwt.js';
import NewUserEmail from '../../services/email/NewUserEmail.js';
import consts from '../../utils/consts.js';
import uploadFileToBucket from '../../services/cloudStorage/uploadFileToBucket.js';

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
    code, name, lastname, email, promotion, career, sex,
  } = req.body;

  const session = await connection.startSession();

  try {
    session.startTransaction();

    const user = await createUser({
      code,
      name,
      lastname,
      email,
      promotion,
      career,
      sex,
      session,
    });

    // guardar token para completar registro
    const token = signRegisterToken({
      id: user.id, name: user.name, lastname: user.lastname, email: user.email,
    });
    await saveRegisterToken({ idUser: user.id, token, session });

    // enviar email de notificación
    const emailSender = new NewUserEmail({ addresseeEmail: email, name, registerToken: token });
    emailSender.sendEmail();

    await session.commitTransaction();

    res.send(single(user, false));
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

const validateRegisterTokenController = async (req, res) => {
  const token = req.headers?.authorization;
  const idUser = req.session?.id;

  try {
    await validateAlterUserToken({ idUser, token });
    res.sendStatus(204);
  } catch (ex) {
    let err = 'Ocurrio un error al validar token de registro.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const saveUserProfilePicture = async ({ file, idUser }) => {
  const filePath = `${global.dirname}/files/${file.fileName}`;

  // subir archivos

  const fileKey = `${consts.bucketRoutes.user}/${idUser}`;

  try {
    await uploadFileToBucket(fileKey, filePath, file.type);
  } catch (ex) {
    throw new CustomError('No se pudo cargar la foto de perfil del usuario.', 500);
  }

  // eliminar archivos temporales
  fs.unlink(filePath, () => { });
};

const finishRegistrationController = async (req, res) => {
  const { password } = req.body;
  const idUser = req.session.id;

  const passwordHash = sha256(password);
  const session = await connection.startSession();

  try {
    session.startTransaction();

    await updateUserPassword({ idUser, passwordHash, session });

    // eliminar tokens para modificar usuario
    await deleteAllUserAlterTokens({ idUser, session });

    // Subir imagen al bucket
    if (req.uploadedFiles?.[0]) saveUserProfilePicture({ file: req.uploadedFiles[0], idUser });

    await session.commitTransaction();

    res.sendStatus(204);
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

export {
  createUserController,
  getActiveUsersController,
  getUserController,
  getLoggedUserController,
  validateRegisterTokenController,
  finishRegistrationController,
};
