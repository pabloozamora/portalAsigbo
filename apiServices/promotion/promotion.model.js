import PromotionSchema from '../../db/schemas/promotion.schema.js';
import { single } from './promotion.dto.js';

const saveCurrentStudentPromotions = async ({ firstYearPromotion, lastYearPromotion }) => {
  const promotionsData = (await PromotionSchema.findOne()) || new PromotionSchema();

  promotionsData.firstYearPromotion = firstYearPromotion;
  promotionsData.lastYearPromotion = lastYearPromotion;

  const result = await promotionsData.save();
  return single(result);
};

// eslint-disable-next-line import/prefer-default-export
export { saveCurrentStudentPromotions };
