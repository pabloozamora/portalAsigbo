import fs from 'node:fs';
import { connection } from '../../db/connection.js';
import uploadFileToBucket from '../../services/cloudStorage/uploadFileToBucket.js';
import consts from '../../utils/consts.js';
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
  const session = await connection.startSession();
  try {
    session.startTransaction();

    const area = await createAsigboArea({
      name, responsible, session,
    });

    // subir archivo del ícono del área
    const file = req.uploadedFiles?.[0];
    if (!file) throw new CustomError("El ícono del área es obligatorio en el campo 'icon'.", 400);

    const fileKey = `${consts.bucketRoutes.area}/${area.id}`;
    const filePath = `${global.dirname}/files/${file.fileName}`;

    await uploadFileToBucket(fileKey, filePath, file.type);

    await session.commitTransaction();

    // Eliminar archivo provisional
    fs.unlink(filePath, () => {});

    res.send(area);
  } catch (ex) {
    await session.abortTransaction();
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
