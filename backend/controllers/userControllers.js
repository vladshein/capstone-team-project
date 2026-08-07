import * as service from "../services/userServices.js";
import HttpError from "../helpers/HttpError.js";

/**
 * Get information about current user
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const { id } = req.user;
    const result = await req.profileStrategy(id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get info by user ID
 *
 * @param {*} req
 * @param {*} res
 */
export const getUserById = async (req, res) => {
  const { userId } = req.params;
  const result = await service.getUserById(userId);
  res.json(result);
};

export const getFollowingController = async (req, res) => {
  const userId =
    req.params.userId === "current" ? req.user.id : req.params.userId;
  const limit = req.query.limit ? req.query.limit : 5;
  const page = req.query.page ? req.query.page : 1;
  const followingsList = await service.getFollowingsList(
    userId,
    Number(limit),
    Number(page),
  );
  res.json(followingsList);
};

export const getFollowersController = async (req, res) => {
  const userId =
    req.params.userId === "current" ? req.user.id : req.params.userId;
  const limit = req.query.limit ? req.query.limit : 5;
  const page = req.query.page ? req.query.page : 1;
  const followersList = await service.getFollowersList(
    userId,
    Number(limit),
    Number(page),
  );
  res.json(followersList);
};
