import express from 'express';
import userRouter from '../apiServices/user/user.route.js';
import sessionRouter from '../apiServices/session/session.route.js';
import activityRouter from '../apiServices/activity/activity.router.js';

const router = express.Router();

const apiPath = '/api';

router.use(`${apiPath}/user`, userRouter);
router.use(`${apiPath}/session`, sessionRouter);
router.use(`${apiPath}/activity`, activityRouter);

export default router;
