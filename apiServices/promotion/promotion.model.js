import PromotionSchema from '../../db/schemas/promotion.schema.js';
import consts from '../../utils/consts.js';
import CustomError from '../../utils/customError.js';
import { single } from './promotion.dto.js';

const saveCurrentStudentPromotions = async ({ firstYearPromotion, lastYearPromotion }) => {
  const promotionsData = (await PromotionSchema.findOne()) || new PromotionSchema();

  promotionsData.firstYearPromotion = firstYearPromotion;
  promotionsData.lastYearPromotion = lastYearPromotion;

  const result = await promotionsData.save();
  return single(result);
};

const getPromotionsGroups = async () => {
  const currentStudents = await PromotionSchema.findOne();

  if (currentStudents === null) {
    throw new CustomError('No se ha configurado las promociones de estudiantes.', 400);
  }

  const { firstYearPromotion, lastYearPromotion } = currentStudents;

  const studentPromotions = [];
  for (let i = firstYearPromotion; i >= lastYearPromotion; i -= 1) {
    studentPromotions.push(i);
  }

  return {
    notStudents: [consts.promotionsGroups.chick, consts.promotionsGroups.graduate],
    students: { id: consts.promotionsGroups.student, years: studentPromotions },
  };
};

const getFirstAndLastYearPromotion = async () => {
  const currentStudents = await PromotionSchema.findOne();
  if (currentStudents === null) {
    throw new CustomError('No se ha configurado las promociones de estudiantes.', 400);
  }
  return single(currentStudents);
};

export { saveCurrentStudentPromotions, getPromotionsGroups, getFirstAndLastYearPromotion };
