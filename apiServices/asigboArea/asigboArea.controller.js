import CustomError from '../../utils/customError.js';
import { multiple, single } from './asigboArea.dto.js';
import {
  createAsigboArea, updateAsigboArea, addResponsible, removeResponsible, getActiveAreas, deleteAsigboArea,
} from './asigboArea.model.js';

const addResponsibleController = async (req, res) => {
  const { idArea, idUser } = req.body || null;

  try {
    const area = await addResponsible({ idArea, idUser });
    res.send(single(area));
  } catch (ex) {
    let err = 'Ocurrio un error al asignar encargado.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const removeResponsibleController = async (req, res) => {
  const { idArea, idUser } = req.body || null;

  try {
    const area = await removeResponsible({ idArea, idUser });
    res.send(single(area));
  } catch (ex) {
    let err = 'Ocurrio un error al remover encargado.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const updateAsigboAreaController = async (req, res) => {
  const { name } = req.body;
  const { idArea } = req.params || null;

  try {
    const area = await updateAsigboArea({ idArea, name });
    res.send(single(area));
  } catch (ex) {
    let err = 'Ocurrio un error al actualizar el area.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const createAsigboAreaController = async (req, res) => {
  const {
    name, responsible,
  } = req.body;

  try {
    const area = await createAsigboArea({
      name, responsible,
    });
    res.send(single(area));
  } catch (ex) {
    let err = 'Ocurrio un error al crear nueva area.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const deleteAsigboAreaController = async (req, res) => {
  const { idArea } = req.params || null;

  try {
    await deleteAsigboArea({ idArea });
    res.sendStatus(204);
  } catch (ex) {
    let err = 'Ocurrio un error al eliminar el area.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const getActiveAreasController = async (req, res) => {
  try {
    const areas = await getActiveAreas();
    res.send(multiple(areas));
  } catch (ex) {
    let err = 'Ocurrio un error al obtener areas activas.';
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
  createAsigboAreaController, updateAsigboAreaController, addResponsibleController, removeResponsibleController, getActiveAreasController, deleteAsigboAreaController,
};
