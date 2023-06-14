import CustomError from '../../utils/customError.js';
import { single } from './asigboArea.dto.js';
import { createAsigboArea, updateAsigboArea } from './asigboArea.model.js';

const updateAsigboAreaController = async (req, res) => {
  const { name } = req.body;
  const { idArea } = req.query || null;

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
    console.log(ex);
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

export { createAsigboAreaController, updateAsigboAreaController };
