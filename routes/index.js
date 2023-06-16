import express from 'express';
import userRouter from '../apiServices/user/user.route.js';
import sessionRouter from '../apiServices/session/session.route.js';
import activityRouter from '../apiServices/activity/activity.router.js';
import asigboAreaRouter from '../apiServices/asigboArea/asigboArea.route.js';
import uploadDataRouter from '../apiServices/uploadData/uploadData.route.js';

const router = express.Router();

const apiPath = '/api';

router.use(`${apiPath}/user`, userRouter);
router.use(`${apiPath}/session`, sessionRouter);
router.use(`${apiPath}/activity`, activityRouter);
router.use(`${apiPath}/area`, asigboAreaRouter);
router.use(`${apiPath}/upload`, uploadDataRouter);

export default router;
