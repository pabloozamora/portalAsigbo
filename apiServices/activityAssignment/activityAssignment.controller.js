import CustomError from '../../utils/customError.js';
import {
  assignManyUsersToActivityMediator, assignUserToActivityMediator, changeActivityAssignmentCompletionStatusMediator, unassignUserFromActivityMediator,
} from './activityAssignment.mediator.js';
import {
  getUserActivities,
} from './activityAssignment.model.js';

const getUserActivitiesController = async (req, res) => {
  const { idUser } = req.params || null;
  try {
    const activities = await getUserActivities(idUser);
    res.send(activities);
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
    res.send(activities);
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

const unassignUserFromActivityController = async (req, res) => {
  const { idActivityAssignment } = req.params;

  try {
    await unassignUserFromActivityMediator({ idActivityAssignment });

    res.sendStatus(204);
  } catch (ex) {
    let err = 'Ocurrio un error al desasignar al usuario de la actividad.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const completeActivityAssignmentController = async (req, res) => {
  try {
    const { idActivityAssignment } = req.params;
    await changeActivityAssignmentCompletionStatusMediator({ idActivityAssignment, completed: true });
    res.sendStatus(204);
  } catch (ex) {
    let err = 'Ocurrio un error al marcar como completada la actividad.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const uncompleteActivityAssignmentController = async (req, res) => {
  try {
    const { idActivityAssignment } = req.params;
    await changeActivityAssignmentCompletionStatusMediator({ idActivityAssignment, completed: false });
    res.sendStatus(204);
  } catch (ex) {
    let err = 'Ocurrio un error al marcar como completada la actividad.';
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
  assignUserToActivityController,
  assignManyUsersToActivityController,
  getUserActivitiesController,
  getLoggedActivitiesController,
  unassignUserFromActivityController,
  completeActivityAssignmentController,
  uncompleteActivityAssignmentController,
};
