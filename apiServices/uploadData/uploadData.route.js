import express from 'express';
import { uploadDataController } from './uploadData.controller.js';
import validateBody from '../../middlewares/validateBody.js';
import uploadDataSchema from './validationSchemas/uploadDataSchema.js';
import ensureAdminAuth from '../../middlewares/ensureAdminAuth.js';

const uploadDataRouter = express.Router();

uploadDataRouter.post('/', ensureAdminAuth, validateBody(uploadDataSchema), uploadDataController);

export default uploadDataRouter;
