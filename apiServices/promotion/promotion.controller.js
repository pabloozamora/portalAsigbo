import CustomError from '../../utils/customError.js';
import Promotion, {
  saveCurrentStudentPromotions,
  /* validateResponsible */
} from './promotion.model.js';

/* const validateResponsibleController = async ({ idUser, promotion }) => {
  const result = await validateResponsible({ idUser, promotion });
  if (!result) throw new CustomError('No cuenta con permisos de encargado sobre esta promoción.');
  return true;
}; */

const saveCurrentStudentPromotionsController = async (req, res) => {
  const { firstYearPromotion, lastYearPromotion } = req.body;

  try {
    const result = await saveCurrentStudentPromotions({ firstYearPromotion, lastYearPromotion });
    res.send(result);
  } catch (ex) {
    let err = 'Ocurrio un error al guardar las promociones de estudiantes actuales.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const getPromotionsGroupsController = async (req, res) => {
  try {
    const promotion = new Promotion();
    const result = await promotion.getPromotionsGroups();
    res.send(result);
  } catch (ex) {
    let err = 'Ocurrio un error al obtener los grupos de promociones.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status ?? 500;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

export { saveCurrentStudentPromotionsController, getPromotionsGroupsController };
