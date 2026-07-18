import express from 'express';
import authenticate from '../middlewares/authenticate.js';
import {
  addToFollowingController,
  getFollowingsListController,
  removeFromFollowingController,
} from '../controllers/followersController.js';

const followRouter = express.Router();

followRouter.post('/:id', authenticate, addToFollowingController);

followRouter.get('/', authenticate, getFollowingsListController);

followRouter.delete('/:id', authenticate, removeFromFollowingController);

export default followRouter;
