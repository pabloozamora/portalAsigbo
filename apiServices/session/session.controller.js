import sha256 from 'js-sha256';
import moment from 'moment';
import config from 'config';
import CustomError from '../../utils/customError.js';
import {
  authenticate, deleteLinkedTokens, deleteSessionToken, storeSessionToken, validateSessionToken,
} from './session.model.js';
import { signAccessToken, signRefreshToken } from '../../services/jwt.js';
import { connection } from '../../db/connection.js';

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

  const session = await connection.startSession();

  try {
    session.startTransaction();

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
      hasImage,
    } = await authenticate(user, passwordHash);

    const refreshToken = await signRefreshToken({
      id, code, name, lastname, promotion, career, sex, role, hasImage,
    });

    // guardar refresh token en bd
    await storeSessionToken({ idUser: id, token: refreshToken, session });

    // almacenar token en cookies
    saveRefreshTokenInCookies(res, refreshToken);

    // crea un access token
    const accessToken = await signAccessToken({
      id, code, name, lastname, promotion, career, sex, role, hasImage,
    });

    // almacenar access token en bd
    await storeSessionToken({
      idUser: id, token: accessToken, linkedToken: refreshToken, session,
    });

    await session.commitTransaction();

    res.send({ accessToken });
  } catch (ex) {
    await session.abortTransaction();

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
    id, code, name, lastname, promotion, career, sex, role, hasImage,
  } = req.session;

  const { refreshToken } = req.cookies;

  try {
    // validar refresh token en bd
    await validateSessionToken(id, refreshToken);

    // create access token
    const accessToken = await signAccessToken({
      id, code, name, lastname, promotion, career, sex, role, hasImage,
    });

    // almacenar access token en bd
    await storeSessionToken({
      idUser: id, token: accessToken, linkedToken: refreshToken,
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
    await deleteSessionToken(refreshToken);

    // eliminar access tokens vinculados
    await deleteLinkedTokens(refreshToken);

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
