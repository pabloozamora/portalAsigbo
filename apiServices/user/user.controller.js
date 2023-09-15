import sha256 from 'js-sha256';
import fs from 'node:fs';
import CustomError from '../../utils/customError.js';
import { multiple, single } from './user.dto.js';
import {
  addRoleToUser,
  createUser,
  deleteAllUserAlterTokens,
  getUsersList,
  getUser,
  removeRoleFromUser,
  saveRegisterToken,
  updateUserPassword,
  validateAlterUserToken,
  updateUserBlockedStatus,
  deleteUser,
  updateUser,
} from './user.model.js';
import { connection } from '../../db/connection.js';
import { signRegisterToken } from '../../services/jwt.js';
import NewUserEmail from '../../services/email/NewUserEmail.js';
import consts from '../../utils/consts.js';
import uploadFileToBucket from '../../services/cloudStorage/uploadFileToBucket.js';
import Promotion from '../promotion/promotion.model.js';
import { forceUserLogout } from '../session/session.model.js';
import { getAreasWhereUserIsResponsible } from '../asigboArea/asigboArea.model.js';
import {
  getActivitiesWhereUserIsResponsible,
  getUserActivities,
} from '../activity/activity.model.js';
import deleteFileInBucket from '../../services/cloudStorage/deleteFileInBucket.js';
import parseBoolean from '../../utils/parseBoolean.js';

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
  fs.unlink(filePath, () => {});
};

const getLoggedUserController = async (req, res) => {
  try {
    const user = await getUser(req.session.id);
    res.send(single(user, { showSensitiveData: true }));
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
    res.send(single(user, { showSensitiveData: true }));
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
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
    });
    await saveRegisterToken({ idUser: user.id, token, session });

    // enviar email de notificación
    const emailSender = new NewUserEmail({ addresseeEmail: email, name, registerToken: token });
    emailSender.sendEmail();

    await session.commitTransaction();

    res.send(single(user));
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

const updateUserController = async (req, res) => {
  const {
    name, lastname, email, promotion, career, sex, removeProfilePicture,
  } = req.body;
  const { idUser } = req.params;

  const session = await connection.startSession();
  const isAdmin = req.session.role?.includes(consts.roles.admin);

  try {
    session.startTransaction();

    // verificar que sea admin o el mismo usuario
    if (!isAdmin && req.session.id !== idUser) {
      throw new CustomError('No estás autorizado para modificar este usuario.', 403);
    }

    await updateUser({
      idUser,
      name,
      lastname,
      email,
      promotion: isAdmin ? promotion : null, // solo admin puede modificar promoción
      career,
      sex,
      session,
    });

    const fileKey = `${consts.bucketRoutes.user}/${idUser}`;
    if (parseBoolean(removeProfilePicture)) {
      // Eliminar foto de perfil

      try {
        await deleteFileInBucket(fileKey);
      } catch {
        throw new CustomError('No se encontró la foto de perfil a eliminar.', 404);
      }
    } else if (req.uploadedFiles?.length > 0) {
      // Subir nueva foto

      try {
        await deleteFileInBucket(fileKey); // Eliminar foto antigua
      } catch (err) {
        // Error no critico
      } finally {
        await saveUserProfilePicture({ file: req.uploadedFiles[0], idUser });
      }
    }

    await session.commitTransaction();

    res.sendStatus(204);
  } catch (ex) {
    await session.abortTransaction();

    let err = 'Ocurrio un error al actualizar usuario.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const getUsersListController = async (req, res) => {
  const {
    promotion, search, page, priority, role, includeBlocked,
  } = req.query;
  try {
    const promotionObj = new Promotion();

    let promotionMin = null;
    let promotionMax = null;
    if (promotion) {
      // si se da un grupo de usuarios, definir rango de promociones
      if (Number.isNaN(parseInt(promotion, 10))) {
        const result = await promotionObj.getPromotionRange({ promotionGroup: promotion });
        promotionMin = result.promotionMin;
        promotionMax = result.promotionMax;
      }
    }

    const { pages, result } = await getUsersList({
      idUser: req.session.id,
      promotion: parseInt(promotion, 10) || null,
      search,
      role,
      promotionMin,
      promotionMax,
      page,
      priority: Array.isArray(priority) ? priority : [priority],
      includeBlocked,
    });

    const parsedUsers = multiple(result, {
      showSensitiveData: req.session.role.includes(consts.roles.admin),
    });

    const resultWithPromotionGroup = await Promise.all(
      parsedUsers.map(async (user) => ({
        ...user,
        promotionGroup: await promotionObj.getPromotionGroup(user.promotion),
      })),
    );

    res.send({
      result: resultWithPromotionGroup,
      pages,
      resultsPerPage: consts.resultsNumberPerPage,
    });
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

const getAdminUsersController = async (req, res) => {
  try {
    const { result } = await getUsersList({
      idUser: req.session.id,
      role: consts.roles.admin,
      page: null,
      showRole: true, // mostrar role si es admin
    });
    res.send(multiple(result));
  } catch (ex) {
    let err = 'Ocurrio un error al obtener los usuarios administradores.';
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

const assignAdminRoleController = async (req, res) => {
  const { idUser } = req.params;

  const session = await connection.startSession();
  try {
    session.startTransaction();
    await addRoleToUser({ idUser, role: consts.roles.admin, session });

    // cerrar sesión del usuario
    await forceUserLogout(idUser, session);

    await session.commitTransaction();

    res.sendStatus(204);
  } catch (ex) {
    await session.abortTransaction();
    let err = 'Ocurrio un error al asignar privilegios de administrador al usuario.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const removeAdminRoleController = async (req, res) => {
  const { idUser } = req.params;
  const session = await connection.startSession();

  try {
    session.startTransaction();

    // verificar que haya más de dos admins
    const { result } = await getUsersList({
      idUser: req.session.id,
      role: consts.roles.admin,
      page: null,
    });

    if (result.length <= 1) {
      throw new CustomError(
        'No es posible eliminar a todos los administradores. En todo momento debe existir por lo menos uno.',
        400,
      );
    }

    await removeRoleFromUser({ idUser, role: consts.roles.admin, session });

    // cerrar sesión del usuario
    await forceUserLogout(idUser, session);

    await session.commitTransaction();

    res.sendStatus(204);
  } catch (ex) {
    await session.abortTransaction();
    let err = 'Ocurrio un error al remover privilegios de administrador al usuario.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const disableUserController = async (req, res) => {
  const { idUser } = req.params;
  const session = await connection.startSession();
  try {
    session.startTransaction();
    await updateUserBlockedStatus({ idUser, blocked: true });

    // Forzar logout
    await forceUserLogout(idUser, session);

    session.commitTransaction();
    res.sendStatus(204);
  } catch (ex) {
    session.abortTransaction();
    let err = 'Ocurrio un error deshabilitar usuario.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const enableUserController = async (req, res) => {
  const { idUser } = req.params;

  try {
    await updateUserBlockedStatus({ idUser, blocked: false });

    res.sendStatus(204);
  } catch (ex) {
    let err = 'Ocurrio un error deshabilitar usuario.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const deleteUserController = async (req, res) => {
  const { idUser } = req.params;
  const session = await connection.startSession();
  try {
    session.startTransaction();

    // verificar que el usuario no haya realizado acciones
    let responsibleAreas;
    try {
      responsibleAreas = await getAreasWhereUserIsResponsible({ idUser, session });
    } catch (ex) {
      // Se espera un error al no encontrar resultados
    }
    if (responsibleAreas?.length > 0) {
      throw new CustomError(
        'No es posible eliminar el usuario, pues este figura como encargado de al menos un eje de ASIGBO.',
        400,
      );
    }

    let responsibleActivities;
    try {
      responsibleActivities = await getActivitiesWhereUserIsResponsible({ idUser, session });
    } catch (ex) {
      // Se espera un error al no encontrar resultados
    }
    if (responsibleActivities?.length > 0) {
      throw new CustomError(
        'No es posible eliminar el usuario, pues este figura como encargado de al menos una actividad.',
        400,
      );
    }

    let activitiesAssignments;
    try {
      activitiesAssignments = await getUserActivities(idUser);
    } catch (ex) {
      // Se espera un error al no encontrar resultados
    }
    if (activitiesAssignments?.length > 0) {
      throw new CustomError(
        'No es posible eliminar el usuario, pues este ha sido inscrito en al menos una actividad.',
        400,
      );
    }

    // verificar que no haya realizado pagos (pendiente)

    await deleteUser({ idUser, session });

    session.commitTransaction();
    res.sendStatus(204);
  } catch (ex) {
    session.abortTransaction();
    let err = 'Ocurrio un error al eliminar usuario.';
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
  getUsersListController,
  getUserController,
  getLoggedUserController,
  validateRegisterTokenController,
  finishRegistrationController,
  getAdminUsersController,
  assignAdminRoleController,
  removeAdminRoleController,
  disableUserController,
  enableUserController,
  deleteUserController,
  updateUserController,
};
