import PromotionSchema from '../../db/schemas/promotion.schema.js';
import consts from '../../utils/consts.js';
import CustomError from '../../utils/customError.js';
import { single } from './promotion.dto.js';

const validateResponsible = async ({ idUser, promotion }) => {
  const { responsible } = await PromotionSchema.findOne({ lastYearPromotion: promotion });
  return responsible.some((user) => user._id.toString() === idUser);
};

const saveCurrentStudentPromotions = async ({ firstYearPromotion, lastYearPromotion }) => {
  const promotionsData = (await PromotionSchema.findOne()) || new PromotionSchema();

  promotionsData.firstYearPromotion = firstYearPromotion;
  promotionsData.lastYearPromotion = lastYearPromotion;

  const result = await promotionsData.save();
  return single(result);
};

class Promotion {
  async getFirstAndLastYearPromotion() {
    if (this.promotion) return this.promotion;
    const currentStudents = await PromotionSchema.findOne();
    if (currentStudents === null) {
      throw new CustomError('No se ha configurado las promociones de estudiantes.', 400);
    }
    this.promotion = single(currentStudents);
    return this.promotion;
  }

  async getPromotionGroup(promotion) {
    const { firstYearPromotion, lastYearPromotion } = await this.getFirstAndLastYearPromotion();
    if (promotion < lastYearPromotion) return consts.promotionsGroups.graduate;
    if (promotion > firstYearPromotion) return consts.promotionsGroups.chick;
    return consts.promotionsGroups.student;
  }

  async getPromotionsGroups() {
    const { firstYearPromotion, lastYearPromotion } = this.getFirstAndLastYearPromotion();

    const studentPromotions = [];
    for (let i = firstYearPromotion; i >= lastYearPromotion; i -= 1) {
      studentPromotions.push(i);
    }

    return {
      notStudents: [consts.promotionsGroups.chick, consts.promotionsGroups.graduate],
      students: { id: consts.promotionsGroups.student, years: studentPromotions },
    };
  }
}

export {
  saveCurrentStudentPromotions,
  validateResponsible,
};
export default Promotion;
