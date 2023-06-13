import express from 'express';
import userRouter from '../apiServices/user/user.route.js';
import sessionRouter from '../apiServices/session/session.route.js';

const router = express.Router();

router.use('/user', userRouter);
router.use('/session', sessionRouter);

export default router;
