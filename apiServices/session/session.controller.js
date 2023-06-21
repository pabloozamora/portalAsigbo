import sha256 from 'js-sha256';
import moment from 'moment';
import config from 'config';
import CustomError from '../../utils/customError.js';
import {
  authenticate, deleteRefreshToken, storeRefreshToken, validateRefreshToken,
} from './session.model.js';
import { signAccessToken, signRefreshToken } from '../../services/jwt.js';

const allowInsecureConnections = config.get('allowInsecureConnections');

const saveRefreshTokenInCookies = (res, token) => {
  res.cookie('refreshToken', token, {
    secure: !allowInsecureConnections,
    httpOnly: true,
    expires: moment().add(1, 'weeks').toDate(),
  });
};

const loginController = async (req, res) => {
  const { user, password } = req.body;

  try {
    const passwordHash = sha256(password);
    const {
      id,
      code,
      name,
      lastname,
      promotion,
      career,
      sex,
      role,
    } = await authenticate(user, passwordHash);

    const refreshToken = await signRefreshToken({
      id, code, name, lastname, promotion, career, sex, role,
    });

    // guardar refresh token en bd
    await storeRefreshToken(id, refreshToken);

    // almacenar token en cookies
    saveRefreshTokenInCookies(res, refreshToken);

    // crea un access token
    const accessToken = await signAccessToken({
      id, code, name, lastname, promotion, career, sex, role,
    });

    res.send({ accessToken });
  } catch (ex) {
    let err = 'Ocurrio un error al intentar loggearse.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const refreshAccessTokenController = async (req, res) => {
  const {
    id, code, name, lastname, promotion, career, sex, role,
  } = req.session;

  const { refreshToken } = req.cookies;

  try {
    // validar refresh token en bd
    await validateRefreshToken(id, refreshToken);

    // create access token
    const accessToken = await signAccessToken({
      id, code, name, lastname, promotion, career, sex, role,
    });

    res.send({ accessToken });
  } catch (ex) {
    let err = 'Ocurrio un error al refrescar access token.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

const logoutController = async (req, res) => {
  const { refreshToken } = req.cookies;

  try {
    // Eliminar token de bd y cookie
    res.clearCookie('refreshToken');
    await deleteRefreshToken(refreshToken);

    res.sendStatus(200);
  } catch (ex) {
    let err = 'Ocurrio un error al cerrar sesión.';
    let status = 500;
    if (ex instanceof CustomError) {
      err = ex.message;
      status = ex.status;
    }
    res.statusMessage = err;
    res.status(status).send({ err, status });
  }
};

export { loginController, refreshAccessTokenController, logoutController };
