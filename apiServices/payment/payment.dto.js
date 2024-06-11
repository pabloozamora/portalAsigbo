import { multiple as multipleUser } from '../user/user.dto.js';

const singlePaymentDto = (resource) => {
  const {
    _id, id, name, limitDate, amount, description, treasurer, targetUsers,
  } = resource?._doc ?? resource ?? {};
  return {
    id: _id?.valueOf() ?? id,
    _id: _id?.valueOf() ?? id,
    name,
    limitDate,
    amount,
    description,
    treasurer: multipleUser(treasurer),
    targetUsers,
  };
};

const multiplePaymentDto = (resources) => resources.map((resource) => singlePaymentDto(resource));

export { singlePaymentDto, multiplePaymentDto };
