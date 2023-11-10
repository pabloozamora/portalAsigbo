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
import errorSender from '../../utils/errorSender.js';

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
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al obtener la información del usuario.',
    });
  }
};

const getUserController = async (req, res) => {
  const { idUser } = req.params || null;
  try {
    const user = await getUser({ idUser, showSensitiveData: true });

    // Filtrar datos privados si no es admin
    let showSensitiveData = user.id === req.session.id;
    if (!showSensitiveData && req.session.role.includes(consts.roles.admin)) {
      showSensitiveData = true;
    }

    res.send(single(user, { showSensitiveData }));
  } catch (ex) {
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al obtener la información del usuario.',
    });
  }
};

const renewRegisterToken = async (req, res) => {
  const { idUser } = req.body;
  const session = await connection.startSession();
  const { role, promotion } = req.session;

  try {
    session.startTransaction();

    const user = await getUser({ idUser, showSensitiveData: true, session });

    if (!role.includes(consts.roles.admin) && promotion !== user.promotion) {
      throw new CustomError('El usuario no tiene acceso para realizar esta acción.', 403);
    }

    if (user.completeRegistration) {
      throw new CustomError('El usuario indicado ya ha sido activado.', 400);
    }

    const token = signRegisterToken({
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      sex: user.sex,
    });

    await saveAlterToken({ idUser, token, session });

    // enviar email de notificación
    const emailSender = new NewUserEmail();
    await emailSender.sendEmail({
      addresseeEmail: user.email,
      name: user.name,
      registerToken: token,
    });

    await session.commitTransaction();

    res.send('Token enviado con éxito.');
  } catch (ex) {
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al generar el token de registro.', session,
    });
  }
};

const createUserController = async (req, res) => {
  const {
    code, name, lastname, email, promotion, career, sex, university, campus,
  } = req.body;

  const session = await connection.startSession();

  try {
    session.startTransaction();

    const user = await createUser({
      code,
      name,
      lastname,
      university,
      campus,
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
      sex: user.sex,
    });
    await saveAlterToken({ idUser: user.id, token, session });

    // enviar email de notificación
    const emailSender = new NewUserEmail();
    emailSender.sendEmail({ addresseeEmail: email, name, registerToken: token })
      .catch(() => {});

    await session.commitTransaction();

    res.send(single(user));
  } catch (ex) {
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al crear nuevo usuario.', session,
    });
  }
};

const updateUserController = async (req, res) => {
  const {
    name, lastname, email, promotion, career, sex, removeProfilePicture, password, university, campus,
  } = req.body;
  const { idUser } = req.params;

  const session = await connection.startSession();
  const isAdmin = req.session.role?.includes(consts.roles.admin);
  const isCurrentUser = req.session.id === idUser;
  const removePicture = parseBoolean(removeProfilePicture);

  try {
    session.startTransaction();

    // verificar que sea admin o el mismo usuario
    if (!isAdmin && !isCurrentUser) {
      throw new CustomError('No estás autorizado para modificar este usuario.', 403);
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
      university,
      campus,
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
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al actualizar usuario.', session,
    });
  }
};

const getUsersListController = async (req, res) => {
  const {
    promotion, search, page, priority, role, includeBlocked, university,
  } = req.query;

  const { role: userRole } = req.session;
  const isAdmin = userRole.includes(consts.roles.admin);
  const isAreaResponsible = userRole.includes(consts.roles.asigboAreaResponsible);
  const isActivityResponsible = userRole.includes(consts.roles.activityResponsible);

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
      university,
      search,
      role,
      promotionMin,
      promotionMax,
      page,
      priority: Array.isArray(priority) ? priority : [priority],
      includeBlocked,
    });

    const parsedUsers = multiple(result, { showSensitiveData: isAdmin });

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
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al obtener los usuarios activos.',
    });
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
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al obtener los usuarios administradores.',
    });
  }
};

const validateRegisterTokenController = async (req, res) => {
  const token = req.headers?.authorization;
  const idUser = req.session?.id;

  try {
    await validateAlterUserToken({ idUser, token });
    res.sendStatus(204);
  } catch (ex) {
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al validar token de registro.',
    });
  }
};

const validateRecoverTokenController = async (req, res) => {
  const token = req.headers?.authorization;
  const idUser = req.session?.id;

  try {
    await validateAlterUserToken({ idUser, token });
    res.sendStatus(204);
  } catch (ex) {
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al validar token para recuperación de contraseña.',
    });
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
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al finalizar registro de nuevo usuario.', session,
    });
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
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al asignar privilegios de administrador al usuario.', session,
    });
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
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al remover privilegios de administrador al usuario.', session,
    });
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
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al asignar privilegios de encargado de promoción al usuario.', session,
    });
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
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al remover privilegios de encargado de promoción al usuario.', session,
    });
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
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al obtener los usuarios encargados de promoción.',
    });
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
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error deshabilitar usuario.', session,
    });
  }
};

const enableUserController = async (req, res) => {
  const { idUser } = req.params;

  try {
    await updateUserBlockedStatus({ idUser, blocked: false });

    res.sendStatus(204);
  } catch (ex) {
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error deshabilitar usuario.',
    });
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
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al eliminar usuario.', session,
    });
  }
};

const uploadUsersController = async (req, res) => {
  const { data: users } = req.body;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const savedUsers = await uploadUsers({ users, session });

    const emailSender = new NewUserEmail();

    await Promise.all(
      savedUsers.map(async (user) => {
        const token = signRegisterToken({
          id: user.id,
          name: user.name,
          lastname: user.lastname,
          email: user.email,
          sex: user.sex,
        });
        await saveAlterToken({ idUser: user.id, token, session });

        // enviar email de notificación
        emailSender.sendEmail({
          addresseeEmail: user.email,
          name: user.name,
          registerToken: token,
        });
      }),
    );

    await session.commitTransaction();
    session.endSession();
    res.send(savedUsers);
  } catch (ex) {
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al insertar la información de usuarios en lista.', session,
    });
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
    const emailSender = new RecoverPasswordEmail();
    emailSender.sendEmail({
      addresseeEmail: email,
      name: user.name,
      recoverToken: token,
    });

    await session.commitTransaction();
    session.endSession();
    res.send({ result: `Correo de recuperación enviado a ${email}` });
  } catch (ex) {
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error en proceso de recuperación de contraseña.', session,
    });
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
    await errorSender({
      res, ex, defaultError: 'Ocurrio un error al actualizar contraseña.', session,
    });
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
