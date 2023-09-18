import mongoose from 'mongoose';
import CustomError from '../../utils/customError.js';
import { generateUsers } from './uploadData.model.js';
import { signRegisterToken } from '../../services/jwt.js';
import { saveRegisterToken } from '../user/user.model.js';
import NewUserEmail from '../../services/email/NewUserEmail.js';

const uploadDataController = async (req, res) => {
  const { data: users } = req.body;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const savedUsers = await generateUsers({ users, session });

    await Promise.all(savedUsers.map(async (user) => {
      const token = signRegisterToken({
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
      });
      await saveRegisterToken({ idUser: user.id, token, session });

      // enviar email de notificación
      const emailSender = new NewUserEmail({ addresseeEmail: user.email, name: user.name, registerToken: token });
      emailSender.sendEmail();
    }));

    await session.commitTransaction();
    session.endSession();
    res.send(savedUsers);
  } catch (ex) {
    await session.abortTransaction();
    session.endSession();
    let err = 'Ocurrio un error al insertar la información.';
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
export { uploadDataController };
