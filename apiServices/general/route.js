import express from 'express';
import { welcomeMessage } from './controller.js';

const router = express.Router();

router.get('/', welcomeMessage);

export default router;
