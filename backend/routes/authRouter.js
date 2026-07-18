import express from 'express';
import validateBody from '../helpers/validateBody.js';
import upload from '../middlewares/upload.js';

import { registerSchema, loginSchema } from '../schemas/authSchemas.js';
import {
  registerController,
  loginController,
  getCurrentController,
  logoutController,
  // updateAvatarController,
} from '../controllers/authControllers.js';
import authenticate from '../middlewares/authenticate.js';

const authRouter = express.Router();

authRouter.post('/register', validateBody(registerSchema), registerController);
authRouter.post('/login', validateBody(loginSchema), loginController);
authRouter.get('/current', authenticate, getCurrentController);
authRouter.post('/logout', authenticate, logoutController);

// authRouter.patch("/avatars", authenticate, upload.single("avatar"), updateAvatarController);

export default authRouter;
