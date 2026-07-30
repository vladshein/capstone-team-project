import express from "express";
import upload from "../middlewares/upload.js";
import authenticate from "../middlewares/authenticate.js";
import {
  getCurrentUser,
  getFollowingController,
  getFollowersController,
  getUserById,
} from "./../controllers/userControllers.js";
import { updateAvatarController } from "../controllers/authControllers.js";

const userRouter = express.Router();

userRouter.get("/current", authenticate, getCurrentUser);
userRouter.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  updateAvatarController,
);
// userRouter.get('/followers', authenticate, getFollowersController);
// userRouter.get('/following', authenticate, getFollowingController);
userRouter.get("/:userId", authenticate, getUserById);
userRouter.get("/:userId/following", authenticate, getFollowingController);
userRouter.get("/:userId/followers", authenticate, getFollowersController);

export default userRouter;
