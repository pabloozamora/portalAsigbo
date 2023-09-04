import consts from '../../utils/consts.js';
import CustomError from '../../utils/customError.js';
import { multiple } from './activity.dto.js';
import {
  createActivityMediator,
  deleteActivityMediator,
  updateActivityMediator,
} from './activity.mediator.js';
import {
  getActivities,
  getActivity,
  getUserActivities,
  validateResponsible,
} from './activity.model.js';

const validateResponsibleController = async ({ idUser, idActivity }) => {
  const result = await validateResponsible({ idUser, idActivity });
  if (!result) throw new CustomError('No cuenta con permisos de encargado sobre esta actividad.');
  return true;
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
  } = req.body;

  try {
    const idPayment = null;
    if (paymentAmount !== undefined && paymentAmount !== null) {
      // lógica para generar pago
    }

    const result = await createActivityMediator({
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
    });

    res.send(result);
  } catch (ex) {
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
  const {
    id,
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
  } = req.body;

  try {
    if (!role.includes(consts.roles.admin)) await validateResponsibleController({ idUser, idActivity: id });
    const result = await updateActivityMediator({
      id,
      name,
      date,
      serviceHours,
      responsible,
      idAsigboArea,
      payment: paymentAmount,
      registrationStartDate,
      registrationEndDate,
      participatingPromotions,
      participantsNumber,
    });

    res.send(result);
  } catch (ex) {
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
  const { id, role } = req.session;
  const { idActivity } = req.params;
  try {
    if (!role.includes(consts.roles.admin)) await validateResponsibleController({ idUser: id, idActivity });
    await deleteActivityMediator({ idActivity });
    res.sendStatus(204);
  } catch (ex) {
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

const getUserActivitiesController = async (req, res) => {
  const { idUser } = req.params || null;
  try {
    const activities = await getUserActivities(idUser);
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
  const { asigboArea, limitDate, query } = req.query;

  try {
    const result = await getActivities({ idAsigboArea: asigboArea, limitDate, query });
    res.send(result);
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
};

const getActivityController = async (req, res) => {
  const { id, role } = req.session;
  const { idActivity } = req.params;

  try {
    if (!role.includes(consts.roles.admin)) await validateResponsibleController({ idUser: id, idActivity });
    const result = await getActivity({ idActivity });
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

export {
  createActivityController,
  updateActivityController,
  deleteActivityController,
  getActivitiesController,
  getActivityController,
  getLoggedActivitiesController,
  getUserActivitiesController,
};
