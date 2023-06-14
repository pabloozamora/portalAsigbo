import CustomError from '../../utils/customError.js';
import { single } from './asigboArea.dto.js';
import { createAsigboArea } from './asigboArea.model.js';

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

// eslint-disable-next-line import/prefer-default-export
export { createAsigboAreaController };
