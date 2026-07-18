import { ObjectId } from 'bson';
import UserFollowers from '../db/models/UserFollowers.js';
import User from '../db/models/User.js';
import Recipe from '../db/models/Recipe.js';
import HttpError from '../helpers/HttpError.js';

export const getFollowingsList = async (userId) => {
  try {
    const followings = await UserFollowers.findAll({
      where: { followerId: userId },
    });
    const followingsIds = followings.map((follow) => follow.followingId);

    const followingsUsersList = await User.findAll({
      where: {
        id: followingsIds,
      },
      attributes: ['id', 'name', 'avatar'],
      include: [
        {
          model: Recipe,
          as: 'recipes',
          attributes: ['id', 'title', 'thumb'],
        },
      ],
    });

    const followingListWithRecipesCount = await Promise.all(
      followingsUsersList.map(async (user) => {
        const count = await Recipe.count({ where: { ownerId: user.id } });
        return { ...user.dataValues, recipesCount: count };
      })
    );

    return followingListWithRecipesCount;
  } catch (error) {
    throw error;
  }
};

export const addToFollowing = async (userId, followUserId) => {
  try {
    const existingFollow = await UserFollowers.findOne({
      where: {
        followerId: userId,
        followingId: followUserId,
      },
    });
    if (existingFollow) {
      throw HttpError(409, 'You are already following this user');
    }

    const newFollow = await UserFollowers.create({
      id: new ObjectId().toString(),
      followerId: userId,
      followingId: followUserId,
    });

    return newFollow;
  } catch (error) {
    throw error;
  }
};

export const removeFromFollowing = async (userId, unfollowUserId) => {
  try {
    const unfollowedUser = await UserFollowers.findOne({
      where: {
        followerId: userId,
        followingId: unfollowUserId,
      },
    });

    if (!unfollowedUser) {
      throw HttpError(404, 'You are not following this user');
    }

    await unfollowedUser.destroy();
    return unfollowedUser;
  } catch (error) {
    throw error;
  }
};
