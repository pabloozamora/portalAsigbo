import sha256 from 'js-sha256';
import fs from 'node:fs';
import mongoose from 'mongoose';
import CustomError from '../../utils/customError.js';
import { multiple, single } from './user.dto.js';
import {
  addRoleToUser,
  createUser,
  deleteAllUserAlterTokens,
  getUsersList,
  getUser,
  removeRoleFromUser,
  saveAlterToken,
  updateUserPassword,
  validateAlterUserToken,
  updateUserBlockedStatus,
  deleteUser,
  updateUser,
  uploadUsers,
  getUserByMail,
} from './user.model.js';
import { connection } from '../../db/connection.js';
import { signRecoverPasswordToken, signRegisterToken } from '../../services/jwt.js';
import NewUserEmail from '../../services/email/NewUserEmail.js';
import consts from '../../utils/consts.js';
import uploadFileToBucket from '../../services/cloudStorage/uploadFileToBucket.js';
import Promotion from '../promotion/promotion.model.js';
import { forceSessionTokenToUpdate, forceUserLogout } from '../session/session.model.js';
import { getAreasWhereUserIsResponsible } from '../asigboArea/asigboArea.model.js';
import {
  getActivitiesWhereUserIsResponsible,
  getUserActivities,
} from '../activity/activity.model.js';
import deleteFileInBucket from '../../services/cloudStorage/deleteFileInBucket.js';
import parseBoolean from '../../utils/parseBoolean.js';
import RecoverPasswordEmail from '../../services/email/RecoverPasswordEmail.js';
import exists from '../../utils/exists.js';

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
    const user = await getUser({ idUser: req.session.id, showSensitiveData: true });
    res.send(user);
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
    const user = await getUser({ idUser, showSensitiveData: true });

    // Filtrar datos privados si no es admin o encargado de año o el mismo usuario
    let showSensitiveData = user.id === req.session.id;
    if (!showSensitiveData && req.session.role.includes(consts.roles.admin)) {
      showSensitiveData = true;
    }
    if (!showSensitiveData && req.session.role.includes(consts.roles.promotionResponsible)) {
      showSensitiveData = user.promotion === req.session.promotion;
    }

    res.send(single(user, { showSensitiveData }));
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

const renewRegisterToken = async (req, res) => {
  const { idUser } = req.body;
  const session = await connection.startSession();

  try {
    session.startTransaction();

    const user = await getUser({ idUser, showSensitiveData: true, session });

    if (user === null) throw new CustomError('El usuario indicado no existe.', 404);
    if (user.completeRegistration) {
      throw new CustomError('El usuario indicado ya ha sido activado.', 400);
    }

    const token = signRegisterToken({
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
    });

    await saveAlterToken({ idUser, token, session });

    // enviar email de notificación
    const emailSender = new NewUserEmail({
      addresseeEmail: user.email,
      name: user.name,
      registerToken: token,
    });
    await emailSender.sendEmail();

    await session.commitTransaction();

    res.send('Token enviado con éxito.');
  } catch (ex) {
    await session.abortTransaction();

    let err = 'Ocurrio un error al generar el token de registro.';
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
    await saveAlterToken({ idUser: user.id, token, session });

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
    name, lastname, email, promotion, career, sex, removeProfilePicture, password,
  } = req.body;
  const { idUser } = req.params;

  const session = await connection.startSession();
  const isAdmin = req.session.role?.includes(consts.roles.admin);
  const isCurrentUser = req.session.id === idUser;
  const isPromotionResponsible = req.session.role?.includes(consts.roles.promotionResponsible);
  const removePicture = parseBoolean(removeProfilePicture);

  try {
    session.startTransaction();

    // verificar que sea admin, encargado de promoción o el mismo usuario
    if (!isAdmin && !isCurrentUser) {
      if (isPromotionResponsible) {
        // Obtener usuario para verificar promoción
        const user = await getUser({ idUser });
        if (user.promotion !== req.session.promotion) {
          throw new CustomError('No estás autorizado para modificar este usuario.', 403);
        }
      } else throw new CustomError('No estás autorizado para modificar este usuario.', 403);
    }

    const passwordHash = (exists(password) && req.session.id === idUser) ? sha256(password) : null;

    let hasImage = null;
    if (removePicture) hasImage = false;
    else if (exists(req.uploadedFiles?.[0])) hasImage = true;

    const { dataBeforeChange } = await updateUser({
      idUser,
      name,
      lastname,
      email,
      promotion: isAdmin ? promotion : null, // solo admin puede modificar promoción
      career,
      sex,
      passwordHash,
      hasImage,
      session,
    });

    const fileKey = `${consts.bucketRoutes.user}/${idUser}`;
    if (dataBeforeChange.hasImage && (removePicture || hasImage)) {
      // Eliminar foto de perfil previa
      try {
        await deleteFileInBucket(fileKey);
      } catch {
        if (removePicture) {
          // El error solo es crítico si se especificó eliminar la imagen
          throw new CustomError('No se encontró la foto de perfil a eliminar.', 404);
        }
      }
    }

    if (hasImage) {
      // Subir nueva foto
      await saveUserProfilePicture({ file: req.uploadedFiles[0], idUser });
    }

    // Actualizar tokens de usuario editado
    await forceSessionTokenToUpdate({ idUser, session });

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

  const { role: userRole } = req.session;
  const isAdmin = userRole.includes(consts.roles.admin);
  const isAreaResponsible = userRole.includes(consts.roles.asigboAreaResponsible);
  const isActivityResponsible = userRole.includes(consts.roles.activityResponsible);
  const isPromotionResponsible = userRole.includes(consts.roles.promotionResponsible);

  try {
    let forcedPromotionFilter = null;
    // Si el usuario cuenta solo con privilegios de encargado de año, aplicar filtro forzado
    if (!isAdmin && !isAreaResponsible && !isActivityResponsible) {
      forcedPromotionFilter = req.session.promotion;
    }

    const promotionObj = new Promotion();

    let promotionMin = null;
    let promotionMax = null;
    if (!forcedPromotionFilter && promotion) {
      // si se da un grupo de usuarios, definir rango de promociones
      if (Number.isNaN(parseInt(promotion, 10))) {
        const result = await promotionObj.getPromotionRange({ promotionGroup: promotion });
        promotionMin = result.promotionMin;
        promotionMax = result.promotionMax;
      }
    }

    const { pages, result } = await getUsersList({
      idUser: req.session.id,
      promotion: forcedPromotionFilter ?? (parseInt(promotion, 10) || null),
      search,
      role,
      promotionMin,
      promotionMax,
      page,
      priority: Array.isArray(priority) ? priority : [priority],
      includeBlocked,
    });

    let parsedUsers = null;

    // Reestringir datos según rol
    if (isAdmin || !isPromotionResponsible) {
      parsedUsers = multiple(result, { showSensitiveData: isAdmin });
    } else if (isPromotionResponsible) {
      // Esconder datos sensibles para usuarios que no coinciden promoción
      parsedUsers = result.map((user) => single(
        user,
        { showSensitiveData: user.promotion === req.session.promotion },
      ));
    }

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

const validateRecoverTokenController = async (req, res) => {
  const token = req.headers?.authorization;
  const idUser = req.session?.id;

  try {
    await validateAlterUserToken({ idUser, token });
    res.sendStatus(204);
  } catch (ex) {
    let err = 'Ocurrio un error al validar token para recuperación de contraseña.';
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
  const hasImage = exists(req.uploadedFiles?.[0]);
  const session = await connection.startSession();

  try {
    session.startTransaction();

    await updateUser({
      idUser, passwordHash, hasImage, session,
    });

    // eliminar tokens para modificar usuario
    await deleteAllUserAlterTokens({ idUser, session });

    // Subir imagen al bucket
    if (hasImage) saveUserProfilePicture({ file: req.uploadedFiles[0], idUser });

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

    // actualizar sesión del usuario
    await forceSessionTokenToUpdate({ idUser, session });

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

    // actualizar sesión del usuario
    await forceSessionTokenToUpdate({ idUser, session });

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

const assignPromotionResponsibleRoleController = async (req, res) => {
  const { idUser } = req.params;

  const session = await connection.startSession();
  try {
    session.startTransaction();
    await addRoleToUser({ idUser, role: consts.roles.promotionResponsible, session });

    // actualizar sesión del usuario
    await forceSessionTokenToUpdate({ idUser, session });

    await session.commitTransaction();

    res.sendStatus(204);
  } catch (ex) {
    await session.abortTransaction();
    let err = 'Ocurrio un error al asignar privilegios de encargado de promoción al usuario.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const removePromotionResponsibleRoleController = async (req, res) => {
  const { idUser } = req.params;
  const session = await connection.startSession();

  try {
    session.startTransaction();

    await removeRoleFromUser({ idUser, role: consts.roles.promotionResponsible, session });

    // actualizar sesión del usuario
    await forceSessionTokenToUpdate({ idUser, session });

    await session.commitTransaction();

    res.sendStatus(204);
  } catch (ex) {
    await session.abortTransaction();
    let err = 'Ocurrio un error al remover privilegios de encargado de promoción al usuario.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const getPromotionResponsibleUsersController = async (req, res) => {
  const { promotion } = req.query;
  try {
    const { result } = await getUsersList({
      role: consts.roles.promotionResponsible,
      page: null,
      promotion,
    });
    res.send(multiple(result));
  } catch (ex) {
    let err = 'Ocurrio un error al obtener los usuarios encargados de promoción.';
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

    // Evitar bloquearse a sí mismo
    if (idUser === req.session.id) {
      throw new CustomError('Un usuario no puede bloquearse a sí mismo.', 400);
    }

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

    // evitar que el usuario se elimine a sí mismo
    if (idUser === req.session.id) {
      throw new CustomError('Un usuario no puede eliminarse a sí mismo.', 400);
    }

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

    // Forzar logout
    await forceUserLogout(idUser, session);

    // eliminar foto de perfil
    try {
      const fileKey = `${consts.bucketRoutes.user}/${idUser}`;
      await deleteFileInBucket(fileKey);
    } catch (ex) {
      // Error no critico. Fallo al eliminar foto
    }

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

const uploadUsersController = async (req, res) => {
  const { data: users } = req.body;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const savedUsers = await uploadUsers({ users, session });

    await Promise.all(
      savedUsers.map(async (user) => {
        const token = signRegisterToken({
          id: user.id,
          name: user.name,
          lastname: user.lastname,
          email: user.email,
        });
        await saveAlterToken({ idUser: user.id, token, session });

        // enviar email de notificación
        const emailSender = new NewUserEmail({
          addresseeEmail: user.email,
          name: user.name,
          registerToken: token,
        });
        emailSender.sendEmail();
      }),
    );

    await session.commitTransaction();
    session.endSession();
    res.send(savedUsers);
  } catch (ex) {
    await session.abortTransaction();
    session.endSession();
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

const recoverPasswordController = async (req, res) => {
  const { email } = req.body;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Verificar que el email ingresado existe en la base de datos
    const user = await getUserByMail({ email });

    // guardar token para completar registro
    const token = signRecoverPasswordToken({
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
    });
    await saveAlterToken({ idUser: user.id, token, session });

    // enviar email de notificación
    const emailSender = new RecoverPasswordEmail({
      addresseeEmail: email,
      name: user.name,
      recoverToken: token,
    });
    emailSender.sendEmail();

    await session.commitTransaction();
    session.endSession();
    res.send({ result: `Correo de recuperación enviado a ${email}` });
  } catch (ex) {
    await session.abortTransaction();
    session.endSession();
    let err = 'Ocurrio un error en proceso de recuperación de contraseña.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const updateUserPasswordController = async (req, res) => {
  const { password } = req.body;
  const idUser = req.session.id;

  const passwordHash = sha256(password);
  const session = await connection.startSession();

  try {
    session.startTransaction();

    await updateUserPassword({ idUser, passwordHash, session });

    // eliminar tokens para modificar usuario
    await deleteAllUserAlterTokens({ idUser, session });

    await session.commitTransaction();

    res.sendStatus(204);
  } catch (ex) {
    await session.abortTransaction();
    session.endSession();
    let err = 'Ocurrio un error al actualizar contraseña.';
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
  renewRegisterToken,
  uploadUsersController,
  recoverPasswordController,
  updateUserPasswordController,
  validateRecoverTokenController,
  assignPromotionResponsibleRoleController,
  removePromotionResponsibleRoleController,
  getPromotionResponsibleUsersController,
};
