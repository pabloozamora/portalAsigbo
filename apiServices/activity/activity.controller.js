import CustomError from '../../utils/customError.js';
import { assignManyUsersToActivityMediator, assignUserToActivityMediator, updateActivityMediator } from './activity.mediator.js';
import {
  createActivity, deleteActivity,
} from './activity.model.js';

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

const assignUserToActivityController = async (req, res) => {
  try {
    const { idUser, idActivity, completed } = req.body;

    const result = await assignUserToActivityMediator({ idUser, idActivity, completed });

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

    const result = await assignManyUsersToActivityMediator({ idUsersList, idActivity, completed });

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

const updateActivityController = async (req, res) => {
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
  const { activityId } = req.params;
  try {
    await deleteActivity({ activityId });
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

export {
  createActivityController,
  assignUserToActivityController,
  assignManyUsersToActivityController,
  updateActivityController,
  deleteActivityController,
};
