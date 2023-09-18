import { ObjectId } from 'mongodb';
import AlterUserTokenSchema from '../../db/schemas/alterUserToken.schema.js';
import UserSchema from '../../db/schemas/user.schema.js';
import consts from '../../utils/consts.js';
import CustomError from '../../utils/customError.js';
import exists, { someExists } from '../../utils/exists.js';
import { multiple, single } from './user.dto.js';
import AsigboAreaSchema from '../../db/schemas/asigboArea.schema.js';
import compareObjectId from '../../utils/compareObjectId.js';

const getUser = async ({ idUser, showSensitiveData, session }) => {
  try {
    const user = await UserSchema.findById(idUser).session(session);
    if (user === null) throw new CustomError('El usuario indicado no existe.', 404);

    return single(user, { showSensitiveData });
  } catch (ex) {
    if (ex?.kind === 'ObjectId') {
      throw new CustomError('El id del usuario no es válido.', 400);
    }
    throw ex;
  }
};

const getUsersInList = async ({ idUsersList, showSensitiveData = false, session }) => {
  try {
    const user = await UserSchema.find({ _id: { $in: idUsersList } }).session(session);
    if (user?.length !== idUsersList.length) throw new CustomError('Algunos de los usuarios no existen.', 404);

    return multiple(user, showSensitiveData);
  } catch (ex) {
    if (ex?.kind === 'ObjectId') {
      throw new CustomError('El id del usuario no es válido.', 400);
    }
    throw ex;
  }
};

const createUser = async ({
  code,
  name,
  lastname,
  email,
  promotion,
  career,
  role,
  sex,
  session,
}) => {
  try {
    const user = new UserSchema();

    user.code = code ?? null;
    user.name = name;
    user.lastname = lastname;
    user.email = email;
    user.promotion = promotion;
    user.career = career;
    user.role = role;
    user.passwordHash = null;
    user.sex = sex;

    await user.save({ session });
    return single(user, { showSensitiveData: true });
  } catch (ex) {
    if (ex.code === 11000 && ex.keyValue?.code !== undefined) {
      throw new CustomError('El código proporcionado ya existe.', 400);
    }
    if (ex.code === 11000 && ex.keyValue?.email !== undefined) {
      throw new CustomError('El email ya se encuentra registrado.', 400);
    }
    if (ex.code === 'ERR_ASSERTION' && ex.path === 'code') {
      throw new CustomError('El código de usuario debe ser un número.');
    }
    throw ex;
  }
};
const updateUser = async ({
  idUser,
  name,
  lastname,
  email,
  promotion,
  career,
  sex,
  session,
}) => {
  try {
    const dataToUpdate = {};

    if (name) dataToUpdate.name = name;
    if (lastname) dataToUpdate.lastname = lastname;
    if (email) dataToUpdate.email = email;
    if (promotion) dataToUpdate.promotion = promotion;
    if (career) dataToUpdate.career = career;
    if (sex) dataToUpdate.sex = sex;

    const { acknowledged, matchedCount } = await UserSchema.updateOne({ _id: idUser }, dataToUpdate, { session });

    if (!acknowledged) throw new CustomError('No fue posible actualizar el usuario.', 500);
    if (matchedCount !== 1) throw new CustomError('No se encontró el usuario.', 404);
  } catch (ex) {
    if (ex.code === 11000 && ex.keyValue?.code !== undefined) {
      throw new CustomError('El código proporcionado ya existe.', 400);
    }
    if (ex.code === 11000 && ex.keyValue?.email !== undefined) {
      throw new CustomError('El email ya se encuentra registrado.', 400);
    }
    if (ex.code === 'ERR_ASSERTION' && ex.path === 'code') {
      throw new CustomError('El código de usuario debe ser un número.');
    }
    throw ex;
  }
};

/**
 * Retorna la lista de usuarios.
 * @param idUser
 * @param promotion filtro para buscar una promoción en específico.
 * @param search subcadena a buscar en el nombre del usuario.
 * @param role role del usuario.
 * @param promotionMin filtro para buscar promociones por arriba de ese año. No incluye a ese valor.
 * @param promotionMax filtro para buscar promociones por abajo de ese año. No incluye a ese valor.
 * @param page número de pagina en los resultados
 * @param includeBlocked Boolean. Indica si se incluyen los usuarios bloqueados. Default false.
 * @returns
 */
const getUsersList = async ({
  promotion, search, role, promotionMin, promotionMax, priority, page = 0, includeBlocked = false,
}) => {
  const query = {};

  if (!includeBlocked) query.blocked = false;
  if (someExists(promotion, promotionMin, promotionMax)) query.promotion = {};
  if (exists(promotion) && !exists(promotionMin) && !exists(promotionMax)) query.promotion.$eq = promotion;
  if (exists(promotionMin)) query.promotion.$gt = promotionMin;
  if (exists(promotionMax)) query.promotion.$lt = promotionMax;
  if (exists(role)) query.role = { $in: [role] };
  if (search) {
    // buscar cadena en nombre completo
    const searchRegex = new RegExp(search, 'i');
    query.$or = [
      { $expr: { $regexMatch: { input: { $concat: ['$name', ' ', '$lastname'] }, regex: searchRegex } } },
    ];
  }

  // parsear id de usuarios prioritarios
  const parsedPriority = priority?.map((id) => {
    if (!exists(id)) return null;
    try {
      return new ObjectId(id);
    } catch (ex) {
      return null;
    }
  }) ?? [];

  // obtener número de páginas
  const usersCount = await UserSchema.countDocuments(query);
  const pages = Math.ceil(usersCount / consts.resultsNumberPerPage);

  const queryPipeline = [
    {
      $match: query,
    },
    {
      $addFields: {
        order: {
          $in: ['$_id', parsedPriority], // obtener valor si el id aparece en priority
        },
        priorityIndex: {
          $indexOfArray: [parsedPriority, '$_id'],
        },
      },
    },
    {
      $sort: {
        order: -1, // priorizar id's que si aparecen
        priorityIndex: 1,
        _id: 1,
      },
    },
  ];

  if (page) {
    queryPipeline.push({
      $skip: page * consts.resultsNumberPerPage,
    });
    queryPipeline.push({
      $limit: consts.resultsNumberPerPage,
    });
  }

  const users = await UserSchema.aggregate(queryPipeline);

  if (users.length === 0) throw new CustomError('No se han encontrado usuarios.', 404);

  return { pages, result: users };
};

const updateServiceHours = async ({
  userId,
  asigboAreaId,
  hoursToRemove = 0,
  hoursToAdd = 0,
  session,
}) => {
  const user = await UserSchema.findById(userId).session(session);

  if (!user) throw new CustomError('El usuario no existe.', 400);
  const serviceHoursAreas = Array.isArray(user.serviceHours?.areas) ? user.serviceHours?.areas : [];

  // Se retira el valor anterior y se ingresa el valor actualidado (previous - new)
  // Si no hay un valor previo en la bd, se ignora y se toma como si fuera 0

  const area = serviceHoursAreas.find((data) => data?.asigboArea && compareObjectId(data.asigboArea._id, asigboAreaId));
  const remainingAreas = serviceHoursAreas.filter((data) => data?.asigboArea && !compareObjectId(data.asigboArea._id, asigboAreaId));

  const newAreaHours = area !== undefined
    ? area.total - hoursToRemove + hoursToAdd
    : hoursToAdd - hoursToRemove;

  const newTotalHours = user.serviceHours?.total !== undefined
    ? user.serviceHours.total - hoursToRemove + hoursToAdd
    : hoursToAdd - hoursToRemove;

  const newAreaModel = {};
  if (!area) {
    // buscar datos del área de asigbo
    const asigboAreaData = await AsigboAreaSchema.findById(asigboAreaId).session(session);
    if (!asigboAreaData) throw new CustomError('El area de asigbo no existe.', 404);

    newAreaModel.asigboArea = asigboAreaData;
    newAreaModel.total = newAreaHours;
  } else {
    // modificar datos existentes
    area.total = newAreaHours;
  }

  user.serviceHours = {
    areas: [...remainingAreas, area ?? newAreaModel],
    total: newTotalHours,
  };

  return user.save({ session });
};

/**
 * Permite agregar un rol a un usuario.
 * @param idUser id del usuario a modificar.
 * @param role role a añadir.
 * @session objeto session de la transacción de bd.
 * @returns Boolean. Retorna true si el rol fue añadido y false si el usuario ya poseía el rol, por
 * lo que no le fue asignado.
 */
const addRoleToUser = async ({ idUser, role, session }) => {
  try {
    const result = await UserSchema.updateOne({ _id: idUser }, { $addToSet: { role } }, { session });
    const { acknowledged, matchedCount, modifiedCount } = result;

    if (matchedCount === 0) throw new CustomError('No se encontró el usuario.', 404);
    if (!acknowledged) throw new CustomError('No fue posible asignar el role.', 500);

    return modifiedCount === 1;
  } catch (ex) {
    if (ex?.kind === 'ObjectId') {
      throw new CustomError('El id del usuario no es válidos.', 400);
    }
    throw ex;
  }
};

const addRoleToManyUsers = async ({ usersIdList = [], role, session }) => {
  if (!Array.isArray(usersIdList)) throw Error('UsersIdList no es un arreglo.');

  try {
    // añadir roles en caso de que no exista un array en el campo role
    const { matchedCount: matchedCount1 } = await UserSchema.updateMany(
      {
        $or: [{ role: { $exists: false } }, { role: { $not: { $type: 'array' } } }],
        _id: { $in: usersIdList },
      },
      { $set: { role: [role] } },
      { session },
    );

    const { matchedCount: matchedCount2 } = await UserSchema.updateMany(
      {
        role: { $exists: true, $type: 'array' },
        _id: { $in: usersIdList },
      },
      { $addToSet: { role } },
      { session },
    );

    if (matchedCount1 + matchedCount2 !== usersIdList.length) {
      throw new CustomError('Ocurrió un error al asignar permisos a usuarios.', 500);
    }
  } catch (ex) {
    if (ex?.kind === 'ObjectId') {
      throw new CustomError('Los id de los usuarios no son validos.', 400);
    }
    throw ex;
  }
};

const removeRoleFromUser = async ({ idUser, role, session }) => {
  try {
    const userData = await UserSchema.findOne({ _id: idUser });

    if (userData === null) {
      throw new CustomError('No se encontró el usuario para eliminar rol.', 404);
    }
    if (!userData.role?.includes(role)) {
      throw new CustomError('El usuario no posee el role proporcionado.', 400);
    }

    userData.role = userData.role.filter((val) => val !== role);

    const result = await userData.save({ session });

    return single(result);
  } catch (ex) {
    if (ex?.kind === 'ObjectId') {
      throw new CustomError('Los id de los usuarios no son validos.', 400);
    }
    throw ex;
  }
};

const saveRegisterToken = async ({ idUser, token, session }) => {
  try {
    // eliminar tokens previos del usuario
    await AlterUserTokenSchema.deleteMany({ idUser }, { session });

    const alterUserToken = new AlterUserTokenSchema();

    alterUserToken.idUser = idUser;
    alterUserToken.token = token;

    await alterUserToken.save({ session });
  } catch (ex) {
    if (ex.code === 11000 && ex.keyValue?.idUser !== undefined) {
      throw new CustomError('El usuario ya posee un token de modificación previo.', 400);
    }
    throw ex;
  }
};

const saveManyRegisterToken = async (data) => {
  try {
    // eliminar tokens previos
    const usersList = data.map((objectData) => objectData.idUser);
    await AlterUserTokenSchema.deleteMany({ idUser: { $in: usersList } });

    // guardar nuevos tokens
    await AlterUserTokenSchema.insertMany(data);
  } catch (ex) {
    if (ex.code === 11000 && ex.keyValue?.idUser !== undefined) {
      throw new CustomError('El usuario ya posee un token de modificación previo.', 400);
    }
    throw ex;
  }
};

const validateAlterUserToken = async ({ idUser, token }) => {
  const result = await AlterUserTokenSchema.findOne({ idUser, token });
  if (result === null) throw new CustomError('El token de registro no es válido.', 401);

  return true;
};

const deleteAlterUserToken = async ({ token, session }) => AlterUserTokenSchema.deleteOne({ token }, { session });

const deleteAllUserAlterTokens = async ({ idUser, session }) => AlterUserTokenSchema.deleteMany({ idUser }, { session });

const updateUserPassword = async ({ idUser, passwordHash, session }) => {
  const user = await UserSchema.findById(idUser);

  if (user === null) throw new CustomError('El usuario no existe.', 400);

  user.passwordHash = passwordHash;

  await user.save({ session });
};

const updateUserBlockedStatus = async ({ idUser, blocked, session }) => {
  try {
    const { acknowledged, matchedCount } = await UserSchema.updateOne({ _id: idUser }, { blocked }, { session });

    if (!matchedCount) throw new CustomError('No se encontró al usuario a modificar.', 404);
    if (!acknowledged) throw new CustomError('No fue posible realizar la modificación del status blocked.', 500);
  } catch (ex) {
    if (ex?.kind === 'ObjectId') {
      throw new CustomError('El id del usuario no es válido.', 404);
    }
    throw ex;
  }
};

const deleteUser = async ({ idUser, session }) => {
  try {
    const { deletedCount, acknowledged } = await UserSchema.deleteOne({ _id: idUser }, { session });
    if (!acknowledged) throw new CustomError('No se encontró el usuario a eliminar.', 404);
    if (deletedCount !== 1) throw new CustomError('No se pudo eliminar el usuario.', 500);
  } catch (ex) {
    if (ex?.kind === 'ObjectId') {
      throw new CustomError('El id del usuario no es válido.', 404);
    }
    throw ex;
  }
};

export {
  createUser,
  getUsersList,
  updateServiceHours,
  getUser,
  addRoleToManyUsers,
  removeRoleFromUser,
  saveRegisterToken,
  saveManyRegisterToken,
  validateAlterUserToken,
  deleteAlterUserToken,
  updateUserPassword,
  deleteAllUserAlterTokens,
  addRoleToUser,
  updateUserBlockedStatus,
  deleteUser,
  updateUser,
  getUsersInList,
};
