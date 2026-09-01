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
export const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await service.getUserById(userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
