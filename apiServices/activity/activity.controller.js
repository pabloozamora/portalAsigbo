/* eslint-disable no-await-in-loop */
import fs from 'node:fs';
import helper from 'csvtojson';
import path from 'node:path';
import { connection } from '../../db/connection.js';
import uploadFileToBucket from '../../services/cloudStorage/uploadFileToBucket.js';
import consts from '../../utils/consts.js';
import CustomError from '../../utils/customError.js';
import exists from '../../utils/exists.js';
import {
  assignManyUsersToActivity,
  getActivityAssignment,
  getActivityAssignments,
  getCompletedActivityAssignmentsById,
} from '../activityAssignment/activityAssignment.model.js';
import {
  getAreas,
  getAreasWhereUserIsResponsible,
  validateResponsible as validateAreaResponsible,
} from '../asigboArea/asigboArea.model.js';
import { forceSessionTokenToUpdate } from '../session/session.model.js';
import {
  addRoleToUser,
  getUsersList,
  removeRoleFromUser,
  updateActivitiesCompletedNumber,
  updateServiceHours,
} from '../user/user.model.js';
import { multiple, single } from './activity.dto.js';
import {
  createActivity,
  deleteActivity,
  getActivities,
  getActivitiesWhereUserIsResponsible,
  getActivity,
  getUserActivities,
  updateActivity,
  updateActivityBlockedStatus,
  updateActivityInAllAssignments,
  uploadActivities,
} from './activity.model.js';
import deleteFileInBucket from '../../services/cloudStorage/deleteFileInBucket.js';

const removeActivityResponsibleRole = async ({ idUser, session }) => {
  try {
    await getActivitiesWhereUserIsResponsible({ idUser, session });
  } catch (ex) {
    if (ex instanceof CustomError) {
      // La única actividad en la que es responsable es en la que se le eliminó, retirar permiso
      await removeRoleFromUser({ idUser, role: consts.roles.activityResponsible, session });
      // Forzar actualizar sesión del usuario
      await forceSessionTokenToUpdate({ idUser, session });
    } else throw ex;
  }
};

const addActivityResponsibleRole = async ({ responsible, session }) => Promise.all(
  responsible?.map(async (idUser) => {
    const roleAdded = await addRoleToUser({
      idUser,
      role: consts.roles.activityResponsible,
      session,
    });
    if (roleAdded) await forceSessionTokenToUpdate({ idUser, session });
  }),
);

const saveBannerPicture = async ({ file, idActivity }) => {
  const filePath = `${global.dirname}/files/${file.fileName}`;

  // subir archivos

  const fileKey = `${consts.bucketRoutes.activity}/${idActivity}`;

  try {
    await uploadFileToBucket(fileKey, filePath, file.type);
  } catch (ex) {
    throw new CustomError('No se pudo cargar el banner de la actividad.', 500);
  }

  // eliminar archivos temporales
  fs.unlink(filePath, () => { });
};

const createActivityController = async (req, res) => {
  const {
    name,
    date,
    serviceHours,
    responsible,
    idAsigboArea,
    paymentAmount,
    registrationStartDate,
    registrationEndDate,
    participatingPromotions,
    participantsNumber,
    description,
  } = req.body;

  const session = await connection.startSession();

  try {
    session.startTransaction();

    // Verificar que el usuario es admin o encargado del área de la actividad
    const { role, id: idUser } = req.session;
    if (!role.includes(consts.roles.admin)) {
      await validateAreaResponsible({ idUser, idArea: idAsigboArea });
    }

    const idPayment = null;
    if (paymentAmount !== undefined && paymentAmount !== null) {
      // lógica para generar pago
    }

    // Verificar si hay una imagen subida
    const hasBanner = exists(req.uploadedFiles?.[0]);

    const activityResult = await createActivity({
      name,
      date,
      serviceHours,
      responsible,
      idAsigboArea,
      idPayment,
      registrationStartDate,
      registrationEndDate,
      participatingPromotions,
      participantsNumber,
      description,
      hasBanner,
      session,
    });

    // Verificar si el área está bloqueada
    if (activityResult.asigboArea.blocked) {
      throw new CustomError('El eje de ASIGBO correspondiente se encuentra bloqueado.', 409);
    }

    // añadir roles de responsables de actividad
    await addActivityResponsibleRole({ responsible, session });

    // subir banner
    if (hasBanner) {
      await saveBannerPicture({ file: req.uploadedFiles[0], idActivity: activityResult.id });
    }

    await session.commitTransaction();

    res.send(activityResult);
  } catch (ex) {
    await session.abortTransaction();

    let err = 'Ocurrio un error al crear nueva actividad.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const updateActivityController = async (req, res) => {
  const { idUser, role } = req.session;
  const { idActivity } = req.params;
  const {
    name,
    date,
    serviceHours,
    responsible,
    paymentAmount,
    registrationStartDate,
    registrationEndDate,
    participatingPromotions,
    participantsNumber,
    removeBanner,
    description,
  } = req.body;

  const session = await connection.startSession();

  try {
    session.startTransaction();

    const idPayment = null;
    if (paymentAmount !== undefined && paymentAmount !== null) {
      // lógica para generar pago
    }

    // Validar si se ha agregado o retirado el banner
    let hasBanner = null; // Si no se agregó, no se realizan cambios
    if (req.uploadedFiles?.length > 0) hasBanner = true;
    if (removeBanner) hasBanner = false;

    const { updatedData, dataBeforeChange } = await updateActivity({
      session,
      id: idActivity,
      name,
      date,
      serviceHours,
      responsible,
      idPayment,
      registrationStartDate,
      registrationEndDate,
      participatingPromotions,
      maxParticipantsNumber: participantsNumber,
      hasBanner,
      description,
    });

    // Verificar que el usuario es admin o encargado del área de la actividad
    if (!role.includes(consts.roles.admin)) {
      await validateAreaResponsible({ idUser, idArea: dataBeforeChange.asigboArea.id });
    }

    // Verificar si el eje está bloqueado
    if (updatedData.asigboArea.blocked) {
      throw new CustomError('El eje de ASIGBO correspondiente se encuentra bloqueado.', 409);
    }

    // actualizar actividad en asignaciones
    if (
      updatedData.name !== dataBeforeChange.name
      || updatedData.date !== dataBeforeChange.date
      || updatedData.serviceHours !== dataBeforeChange.serviceHours
      || updatedData.asigboArea.id !== dataBeforeChange.asigboArea.id
    ) {
      await updateActivityInAllAssignments({
        activity: { ...updatedData, _id: updatedData.id },
        session,
      });
    }

    // actualizar horas de servicio en usuario
    if (updatedData.serviceHours !== dataBeforeChange.serviceHours) {
      const completedAssignments = await getCompletedActivityAssignmentsById(updatedData.id);

      // Modificar valor para cada usuario
      const promises = [];
      completedAssignments?.forEach((assignment) => {
        const userId = assignment.user._id;

        promises.push(
          updateServiceHours({
            userId,
            asigboAreaId: updatedData.asigboArea.id,
            hoursToRemove: dataBeforeChange.serviceHours,
            hoursToAdd: updatedData.serviceHours,
            session,
          }),
        );
      });

      Promise.all(promises);
    }

    // modificar el monto del pago o eliminarlo (pendiente)

    // retirar permisos a responsables retirados
    const usersRemoved = dataBeforeChange.responsible
      .filter(
        (beforeUser) => !updatedData.responsible.some((updatedUser) => beforeUser.id === updatedUser.id),
      )
      .map((user) => user.id);
    await Promise.all(
      usersRemoved.map((userId) => removeActivityResponsibleRole({ idUser: userId, session })),
    );

    // añadir permisos a nuevos responsables
    const usersAdded = updatedData.responsible
      .filter(
        (updatedUser) => !dataBeforeChange.responsible.some((beforeUser) => beforeUser.id === updatedUser.id),
      )
      .map((user) => user.id);

    await addActivityResponsibleRole({ responsible: usersAdded, session });

    // Eliminar archivo previo si ya había un banner
    if (dataBeforeChange.hasBanner && (hasBanner || removeBanner)) {
      const fileKey = `${consts.bucketRoutes.activity}/${idActivity}`;
      try {
        await deleteFileInBucket(fileKey);
      } catch (ex) {
        // Error no crítico, no se eliminó el banner
      }
    }

    // Subir nuevo banner
    if (hasBanner) {
      await saveBannerPicture({ file: req.uploadedFiles[0], idActivity });
    }

    await session.commitTransaction();

    res.send(single(updatedData));
  } catch (ex) {
    await session.abortTransaction();

    let err = 'Ocurrio un error al actualizar actividad.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const deleteActivityController = async (req, res) => {
  const { id: idUser, role } = req.session;
  const { idActivity } = req.params;

  const session = await connection.startSession();

  try {
    session.startTransaction();

    const { responsible, asigboArea: { id: idArea, blocked } } = await getActivity({
      idActivity,
      showSensitiveData: true,
    });

    if (!role.includes(consts.roles.admin)) {
      await validateAreaResponsible({ idUser, idArea });
    }

    // Verificar que el eje no se encuentre bloqueado
    if (blocked) {
      throw new CustomError('El eje de ASIGBO correspondiente se encuentra bloqueado.', 409);
    }

    // Verificar que la actividad no tenga asignaciones
    let assignments;
    try {
      assignments = await getActivityAssignments({
        idActivity,
        includeUserPromotionGroup: false,
      });
    } catch (err) {
      // Error no crítico. Se espera un 404
    }

    if (assignments?.length > 0) {
      throw new CustomError(
        'La actividad no puede ser eliminada mientras existan usuarios asignados.',
      );
    }

    await deleteActivity({ idActivity, session });

    // retirar permisos a responsables retirados
    await Promise.all(
      responsible?.map((user) => removeActivityResponsibleRole({ idUser: user.id, session })),
    );

    await session.commitTransaction();

    res.sendStatus(204);
  } catch (ex) {
    await session.abortTransaction();

    let err = 'Ocurrio un error al eliminar actividad.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const getLoggedActivitiesController = async (req, res) => {
  try {
    const activities = await getUserActivities(req.session.id);
    res.send(multiple(activities));
  } catch (ex) {
    let err = 'Ocurrio un error al obtener las actividades del usuario.';
    let status = 500;

    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const getActivitiesController = async (req, res) => {
  const {
    asigboArea, search, lowerDate, upperDate, page,
  } = req.query;

  try {
    let completeResult = null;
    if (exists(page)) {
      // Obtener número total de resultados si se selecciona página
      completeResult = await getActivities({
        idAsigboArea: asigboArea, search, lowerDate, upperDate,
      });
    }

    const result = await getActivities({
      idAsigboArea: asigboArea, search, lowerDate, upperDate, page,
    });

    // Si es admin, retornar lista completa
    if (req.session.role.includes(consts.roles.admin)) {
      return res.send({
        pages: Math.ceil((completeResult?.length ?? result.length) / consts.resultsNumberPerPage),
        resultsPerPage: consts.resultsNumberPerPage,
        result,
      });
    }

    // filtrar dependiendo de privilegio
    const areasWhereUserIsResponsible = [];
    const activitiesWhereUserIsResponsible = [];

    // Obtener áreas donde es encargado el usuario
    if (req.session.role.includes(consts.roles.asigboAreaResponsible)) {
      try {
        const areas = await getAreasWhereUserIsResponsible({ idUser: req.session.id });
        areasWhereUserIsResponsible.push(...areas.map((area) => area.id));
      } catch (err) {
        // Error no crítico: no se obtuvieron resultados
      }
    }

    // Obtener id de actividades donde es encargado el usuario
    if (req.session.role.includes(consts.roles.activityResponsible)) {
      try {
        const activities = await getActivitiesWhereUserIsResponsible({ idUser: req.session.id });
        activitiesWhereUserIsResponsible.push(...activities.map((ac) => ac.id));
      } catch (err) {
        // Error no crítico: no se obtuvieron resultados
      }
    }

    const filteredCompleteResult = completeResult?.filter(
      (activity) => areasWhereUserIsResponsible.includes(activity.asigboArea.id)
        || activitiesWhereUserIsResponsible.includes(activity.id),
    );

    const filteredResult = result.filter(
      (activity) => areasWhereUserIsResponsible.includes(activity.asigboArea.id)
        || activitiesWhereUserIsResponsible.includes(activity.id),
    );

    if (filteredResult.length === 0) throw new CustomError('No se encontraron resultados.', 404);

    res.send({
      pages: Math.ceil((filteredCompleteResult?.length ?? filteredResult.length) / consts.resultsNumberPerPage),
      resultsPerPage: consts.resultsNumberPerPage,
      result: filteredResult,
    });
  } catch (ex) {
    let err = 'Ocurrio un error al obtener lista de actividades.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
  return null;
};

const getActivityController = async (req, res) => {
  const { idActivity } = req.params;

  try {
    const result = await getActivity({ idActivity, showSensitiveData: true });

    // Para el área de asigbo, verificar si el usuario es encargado
    let isResponsible = false;
    try {
      const areas = await getAreasWhereUserIsResponsible({ idUser: req.session.id });
      isResponsible = areas?.some((area) => area.id === result.asigboArea.id);
    } catch (err) {
      // Error no critico
    }

    result.asigboArea.isResponsible = isResponsible;

    // Adjuntar asignación (si existe) del usuario en sesión
    try {
      const [userAssignment] = await getActivityAssignments({ idUser: req.session.id, idActivity });
      result.userAssignment = userAssignment;
    } catch (err) {
      // error no critico (404)
    }

    res.send(result);
  } catch (ex) {
    let err = 'Ocurrio un error al obtener información de la actividad.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const disableActivityController = async (req, res) => {
  const { idActivity } = req.params;

  const session = await connection.startSession();
  try {
    session.startTransaction();

    const activity = await getActivity({ idActivity });

    // Si no es admin, verificar si es encargado de área
    if (!req.session.role.includes(consts.roles.admin)) {
      await validateAreaResponsible({ idUser: req.session.id, idArea: activity.asigboArea });
    }

    // Verificar que el eje no se encuentre bloqueado
    if (activity.asigboArea.blocked) {
      throw new CustomError('El eje de ASIGBO correspondiente se encuentra bloqueado.', 409);
    }

    const updatedActivity = await updateActivityBlockedStatus({
      idActivity,
      blocked: true,
      session,
    });

    await updateActivityInAllAssignments({ activity: updatedActivity, session });

    await session.commitTransaction();
    res.sendStatus(204);
  } catch (ex) {
    await session.abortTransaction();

    let err = 'Ocurrio un error al deshabilitar la actividad.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const enableActivityController = async (req, res) => {
  const { idActivity } = req.params;

  const session = await connection.startSession();
  try {
    session.startTransaction();

    const activity = await getActivity({ idActivity });

    // Si no es admin, verificar si es encargado de área
    if (!req.session.role.includes(consts.roles.admin)) {
      await validateAreaResponsible({ idUser: req.session.id, idArea: activity.asigboArea });
    }

    // Verificar que el eje no se encuentre bloqueado
    if (activity.asigboArea.blocked) {
      throw new CustomError('El eje de ASIGBO correspondiente se encuentra bloqueado.', 409);
    }

    const updatedActivity = await updateActivityBlockedStatus({
      idActivity,
      blocked: false,
      session,
    });

    await updateActivityInAllAssignments({ activity: updatedActivity, session });

    await session.commitTransaction();

    res.sendStatus(204);
  } catch (ex) {
    await session.abortTransaction();

    let err = 'Ocurrio un error al habilitar la actividad.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const getActivitiesWhereUserIsResponsibleController = async (req, res) => {
  const { idUser } = req.params;
  const {
    search, lowerDate, upperDate, page,
  } = req.query;
  try {
    // Validar permisos de acceso
    if (!req.session?.role?.includes(consts.roles.admin) && idUser !== req.session.id) {
      throw new CustomError(
        'No se cuentan con los privilegios para acceder a la información de este usuario.',
        403,
      );
    }

    let pagesNumber = null;
    if (exists(page)) {
      // Obtener número total de resultados si se selecciona página
      const completeResult = await getActivitiesWhereUserIsResponsible({
        idUser, search, lowerDate, upperDate,
      });
      pagesNumber = completeResult.length;
    }

    const result = await getActivitiesWhereUserIsResponsible({
      idUser, search, lowerDate, upperDate, page,
    });

    res.send({
      pages: Math.ceil((pagesNumber ?? result.length) / consts.resultsNumberPerPage),
      resultsPerPage: consts.resultsNumberPerPage,
      result,
    });
  } catch (ex) {
    let err = 'Ocurrio un error al obtener las actividades en las que el usuario es encargado.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const uploadActivitiesDataController = async (req, res) => {
  const { path: filePath } = req.body;
  const session = await connection.startSession();

  try {
    session.startTransaction();

    const fileExtension = path.extname(filePath);
    if (fileExtension !== '.csv') throw new CustomError('El archivo de importación debe estar en formato .csv');

    const problems = [];
    const assignments = [];
    const activities = [];
    const usersToUpdate = [];
    const { result: admins } = await getUsersList({ role: consts.roles.admin });
    const { result: users } = await getUsersList({
      promotion: null, university: null, search: null, role: null, promotionMin: null, promotionMax: null, priority: null,
    });
    const areas = await getAreas();

    const rows = await helper().fromFile(filePath, { encoding: 'binary' });
    const headers = Object.keys(rows[0]);
    if (!consts.activityFileHeaders.every((header) => headers.includes(header))) {
      throw new CustomError(`Las cabeceras del archivo deben ser '${consts.activityFileHeaders.join(', ')}'`);
    }

    const currentActivities = await getActivities(session);

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const {
        Actividad: activityName, Area: area, Fecha: activityDate, Participante: attendantCode, Horas,
      } = row;
      const serviceHours = Horas.trim() !== '' ? parseInt(Horas.trim(), 10) : undefined;
      // eslint-disable-next-line no-continue
      if (!serviceHours) continue;
      const existsActivity = currentActivities && currentActivities.length > 0
        ? currentActivities.find((current) => current.name === activityName && current.asigboArea._id.toString() === area)
        : undefined;

      const existsArea = areas && areas.length > 0
        ? areas.find((a) => a._id === area) : undefined;
      const existsUser = users && users.length > 0
        ? users.find((u) => u.code.toString() === attendantCode) : undefined;
      if (!existsArea || !existsUser) {
        const reason = !existsArea ? 'El área indicada no existe' : 'El usuario indicado no existe';
        problems.push({ row, index: i + 1, reason });
        // eslint-disable-next-line no-continue
        continue;
      }

      if (existsActivity) {
        const existsAssignment = await getActivityAssignment({ idUser: existsUser._id, idActivity: existsActivity._id, session });

        if (existsAssignment && existsAssignment.length > 0) {
          problems.push({ row, index: i + 1, reason: `El usuario con el código ${attendantCode} ya está asignado a la actividad '${activityName}'` });
          // eslint-disable-next-line no-continue
          continue;
        }
      }

      const foundAssignment = assignments.find((a) => (
        a.activity.name === activityName && a.activity.asigboArea._id === area
      ));

      const activity = existsActivity || (foundAssignment ? foundAssignment.activity : undefined);

      const attendant = {
        user: existsUser,
        completed: true,
        aditionalServiceHours: serviceHours,
        session,
      };

      const formatedDate = new Date(activityDate.trim());

      if (activity) {
        assignments.push({ ...attendant, activity });
        activity.participantsNumber += 1;
        activity.maxParticipants += 1;
      } else {
        const newActivity = {
          name: activityName.trim(),
          date: formatedDate,
          serviceHours: 0,
          responsible: admins.map((admin) => ({ ...admin, hasImage: false })),
          asigboArea: existsArea,
          payment: null,
          registrationStartDate: formatedDate,
          registrationEndDate: formatedDate,
          participatingPromotions: null,
          participantsNumber: 1,
          maxParticipants: 1,
          description: 'Sin descripción',
          hasBanner: false,
        };
        assignments.push({ ...attendant, activity: newActivity });
        activities.push(newActivity);
      }
      usersToUpdate.push({
        userId: existsUser._id,
        asigboAreaId: area,
        hoursToAdd: serviceHours,
      });
    }
    const savedActivities = activities.length > 0
      ? await uploadActivities({ activities, session })
      : undefined;
    assignments.forEach((assignment) => {
      if (assignment.activity._id) return;

      const savedActivity = savedActivities.find((act) => (
        act.name === assignment.activity.name && act.asigboArea._id.toString() === assignment.activity.asigboArea._id
      ));
      // eslint-disable-next-line no-param-reassign
      assignment.activity = savedActivity;
    });
    if (assignments.length > 0) {
      await assignManyUsersToActivity({ assignmentsList: assignments.flat(), session });
    }

    for (const user of usersToUpdate) {
      const { userId, asigboAreaId, hoursToAdd } = user;
      await updateServiceHours({
        userId,
        asigboAreaId,
        hoursToAdd,
        session,
      });
      await updateActivitiesCompletedNumber({ idUser: userId, add: 1, session });
    }

    await session.commitTransaction();
    // await session.abortTransaction();
    res.send({ success: true, problems });
  } catch (ex) {
    await session.abortTransaction();
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

export {
  createActivityController,
  updateActivityController,
  deleteActivityController,
  getActivitiesController,
  getActivityController,
  getLoggedActivitiesController,
  disableActivityController,
  enableActivityController,
  getActivitiesWhereUserIsResponsibleController,
  uploadActivitiesDataController,
};
