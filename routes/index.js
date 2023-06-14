import express from 'express';
import userRouter from '../apiServices/user/user.route.js';
import sessionRouter from '../apiServices/session/session.route.js';
import asigboAreaRouter from '../apiServices/asigboArea/asigboArea.route.js';

const router = express.Router();

router.use('/user', userRouter);
router.use('/session', sessionRouter);
router.use('/area', asigboAreaRouter);

export default router;
