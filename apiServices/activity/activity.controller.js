import CustomError from '../../utils/customError.js';
import { multiple } from './activity.dto.js';
import {
  assignManyUsersToActivity,
  assignUserToActivity,
  createActivity,
  getUserActivities,
} from './activity.model.js';

const getUserActivitiesController = async (req, res) => {
  const { idUser } = req.query || null;
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
  } = req.body;

  try {
    const idPayment = null;
    if (paymentAmount !== undefined && paymentAmount !== null) {
      // lógica para generar pago
    }

    const result = await createActivity({
      name,
      date,
      serviceHours,
      responsible,
      idAsigboArea,
      idPayment,
      registrationStartDate,
      registrationEndDate,
      participatingPromotions,
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

const assignUserToActivityController = async (req, res) => {
  try {
    const { idUser, idActivity, completed } = req.body;

    const result = await assignUserToActivity({ idUser, idActivity, completed });

    res.send(result);
  } catch (ex) {
    let err = 'Ocurrio un error al asignar usuarios a una actividad.';
    let status = 500;

    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const assignManyUsersToActivityController = async (req, res) => {
  try {
    const { idUsersList, idActivity, completed } = req.body;

    const result = await assignManyUsersToActivity({ idUsersList, idActivity, completed });

    res.send(result);
  } catch (ex) {
    let err = 'Ocurrio un error al asignar lista de usuarios a una actividad.';
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
  assignUserToActivityController,
  assignManyUsersToActivityController,
  getUserActivitiesController,
  getLoggedActivitiesController,
};
