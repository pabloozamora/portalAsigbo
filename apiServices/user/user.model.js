import UserSchema from '../../db/schemas/user.schema.js';
import CustomError from '../../utils/customError.js';

const getUser = async (idUser) => {
  const user = await UserSchema.findById(idUser);
  if (user === null) throw new CustomError('El usuario indicado no existe.', 404);

  return user;
};

const createUser = async ({
  code,
  name,
  lastname,
  email,
  promotion,
  career,
  role,
  passwordHash,
  sex,
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
    user.passwordHash = passwordHash;
    user.sex = sex;

    await user.save();
    return user;
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

const getActiveUsers = async (idUser) => {
  const users = await UserSchema.find({ blocked: false, _id: { $ne: idUser } });

  if (users.length === 0) throw new CustomError('No se han encontrado usuarios.', 404);

  return users;
};

const updateServiceHours = async ({
  userId,
  asigboAreaId,
  hoursToRemove = 0,
  hoursToAdd = 0,
  session,
}) => {
  const userData = await UserSchema.findById(userId);

  if (!userData) throw new CustomError('El usuario no existe.', 400);

  const serviceHoursAreas = userData.serviceHours?.areas ?? {};

  // Se retira el valor anterior y se ingresa el valor actualidado (previous - new)
  // Si no hay un valor previo en la bd, se ignora y se toma como si fuera 0

  const newAreaHours = serviceHoursAreas[asigboAreaId] !== undefined
    ? serviceHoursAreas[asigboAreaId] - hoursToRemove + hoursToAdd
    : hoursToAdd - hoursToRemove;

  const newTotalHours = userData.serviceHours?.total !== undefined
    ? userData.serviceHours.total - hoursToRemove + hoursToAdd
    : hoursToAdd - hoursToRemove;

  userData.serviceHours = {
    areas: { ...serviceHoursAreas, [asigboAreaId]: newAreaHours },
    total: newTotalHours,
  };

  return userData.save({ session });
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

    if (matchedCount1 + matchedCount2 !== usersIdList.length) throw new CustomError('Ocurrió un error al asignar permisos a usuarios.', 500);
  } catch (ex) {
    if (ex?.kind === 'ObjectId') throw new CustomError('Los id de los usuarios no son validos.', 400);
  }
};

export {
  createUser, getActiveUsers, updateServiceHours, getUser, addRoleToManyUsers,
};
