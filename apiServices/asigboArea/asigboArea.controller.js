import fs from 'node:fs';
import { connection } from '../../db/connection.js';
import uploadFileToBucket from '../../services/cloudStorage/uploadFileToBucket.js';
import consts from '../../utils/consts.js';
import CustomError from '../../utils/customError.js';
import { multiple, single } from './asigboArea.dto.js';
import { multiple as multipleUser } from '../user/user.dto.js';
import {
  createAsigboArea,
  updateAsigboArea,
  getActiveAreas,
  deleteAsigboArea,
  getArea,
  removeAsigboAreaResponsible,
  // validateResponsible,
} from './asigboArea.model.js';
import Promotion from '../promotion/promotion.model.js';
import deleteFileInBucket from '../../services/cloudStorage/deleteFileInBucket.js';

/* const validateResponsibleController = async ({ idUser, idArea }) => {
  const result = await validateResponsible({ idUser, idArea });
  if (!result) throw new CustomError('No cuenta con permisos de encargado sobre esta área.');
  return true;
}; */

const updateAsigboAreaController = async (req, res) => {
  const { name, responsible } = req.body;
  const { idArea } = req.params;

  const session = await connection.startSession();

  const file = req.uploadedFiles?.[0];
  const filePath = file ? `${global.dirname}/files/${file.fileName}` : null;

  try {
    session.startTransaction();

    const area = await updateAsigboArea({ idArea, name, responsible });

    // actualizar icono si se subió nueva imagen
    if (file) {
      const fileKey = `${consts.bucketRoutes.area}/${area.id}`;

      // eliminar imagen antigua
      try {
        await deleteFileInBucket(fileKey);
      } catch (err) {
        // No se encontró el archivo o no se pudo eliminar
      } finally {
        // intentar subir nueva imágen
        await uploadFileToBucket(fileKey, filePath, file.type);
      }
    }

    await session.commitTransaction();

    const parsedArea = single(area);
    parsedArea.responsible = multipleUser(parsedArea.responsible, false);

    res.send(parsedArea);
  } catch (ex) {
    await session.abortTransaction();
    let err = 'Ocurrio un error al actualizar el area.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  } finally {
    // Eliminar archivo provisional
    if (filePath) fs.unlink(filePath, () => { });
  }
};

const createAsigboAreaController = async (req, res) => {
  const { name, responsible } = req.body;
  const session = await connection.startSession();

  const file = req.uploadedFiles?.[0];
  const filePath = file ? `${global.dirname}/files/${file.fileName}` : null;

  try {
    session.startTransaction();

    const area = await createAsigboArea({
      name,
      responsible,
      session,
    });

    // subir archivo del ícono del área
    if (!file) throw new CustomError("El ícono del área es obligatorio en el campo 'icon'.", 400);

    const fileKey = `${consts.bucketRoutes.area}/${area.id}`;

    await uploadFileToBucket(fileKey, filePath, file.type);

    await session.commitTransaction();

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
  } finally {
    // Eliminar archivo provisional
    if (file) fs.unlink(filePath, () => { });
  }
};

const getAsigboAreaController = async (req, res) => {
  const { idArea } = req.params;
  try {
    const areaData = await getArea({ idArea });
    const parsedData = single(areaData);
    const parsedUsers = multipleUser(parsedData.responsible);

    // get user promotion group
    const promotionObj = new Promotion();

    parsedData.responsible = await Promise.all(
      parsedUsers.map(async (user) => ({
        ...user,
        promotionGroup: await promotionObj.getPromotionGroup(user.promotion),
      })),
    );

    res.send(parsedData);
  } catch (ex) {
    let err = 'Ocurrio un error al obtener area de asigbo.';
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
  const { idArea } = req.params;
  const session = await connection.startSession();

  try {
    session.startTransaction();

    await removeAsigboAreaResponsible({ idArea, session });
    await deleteAsigboArea({ idArea, session });

    await session.commitTransaction();

    // eliminar icono
    try {
      const fileKey = `${consts.bucketRoutes.area}/${idArea}`;
      await deleteFileInBucket(fileKey);
    } catch (err) {
      // error al eliminar archivo (no critico)
    }

    res.sendStatus(204);
  } catch (ex) {
    await session.abortTransaction();

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
    const parsedAreas = multiple(areas);

    const areasResult = parsedAreas.map((area) => {
      const areaCopy = { ...area };
      areaCopy.responsible = multipleUser(area.responsible, false);
      return areaCopy;
    });

    res.send(areasResult);
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
  createAsigboAreaController,
  updateAsigboAreaController,
  getActiveAreasController,
  deleteAsigboAreaController,
  getAsigboAreaController,
};
