import jwt from 'jsonwebtoken';
import moment from 'moment';
import config from 'config';
import consts from '../utils/consts.js';

const key = config.get('jwtKey');

const signRefreshToken = async ({
  id, code, name, lastname, promotion, career, sex, role,
}) => jwt.sign(
  {
    id,
    code,
    name,
    lastname,
    promotion,
    career,
    sex,
    role,
    exp: moment().add(1, 'week').unix(),
    type: consts.token.refresh,
  },
  key,
);

const signAccessToken = ({
  id, code, name, lastname, promotion, career, sex, role,
}) => jwt.sign(
  {
    id,
    code,
    name,
    lastname,
    promotion,
    career,
    sex,
    role,
    exp: moment().add(1, 'day').unix(),
    type: consts.token.access,
  },
  key,
);

const signRegisterToken = ({
  id, name, lastname,
}) => jwt.sign(
  {
    id,
    name,
    lastname,
    exp: moment().add(6, 'month').unix(),
    type: consts.token.register,
  },
  key,
);

const validateToken = async (token) => jwt.verify(token, key);

export {
  signAccessToken, signRefreshToken, signRegisterToken, validateToken,
};
