import * as service from "../services/userServices.js";

/**
 * Get information about current user
 *
 * @param {*} req
 * @param {*} res
 */
export const getCurrentUser = async (req, res) => {
  const { id } = req.user;
  // const result = await service.getCurrentUser(id);
  const result = await service.getCurrentUserInfo(id);
  res.json(result);
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
