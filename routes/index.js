import express from 'express';
import generalRouter from '../apiServices/general/route.js';
import userRouter from '../apiServices/user/user.route.js';

const router = express.Router();

router.use('/user', userRouter);
router.get('/', generalRouter);

export default router;
