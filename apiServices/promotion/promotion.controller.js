import CustomError from '../../utils/customError.js';
import { saveCurrentStudentPromotions } from './promotion.model.js';

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

// eslint-disable-next-line import/prefer-default-export
export { saveCurrentStudentPromotionsController };
