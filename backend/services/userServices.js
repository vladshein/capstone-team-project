import { Recipe, User, FavoriteRecipe, UserFollowers } from '../db/models/index.js';
import { fn, col } from 'sequelize';
import HttpError from '../helpers/HttpError.js';

/**
 * function with universal where statement
 *
 * @param {*} where
 * @returns
 */
export const findUser = async (where) => {
  return User.findOne({ where });
};

/**
 * Current user information
 *
 * @param {*} userId
 * @returns
 */
export const getCurrentUserInfo = async (userId) => {
  //
  return await User.findOne({
    where: { id: userId },

    attributes: [
      'id',
      'avatar',
      'name',
      'email',
      [fn('COUNT', fn('DISTINCT', col('recipesHas.id'))), 'count_user_recipes'],
      [fn('COUNT', fn('DISTINCT', col('favoriteRecipesHas.recipeId'))), 'count_favorite_recipes'],
      [fn('COUNT', fn('DISTINCT', col('followersHas.followerId'))), 'count_followers'],
      [fn('COUNT', fn('DISTINCT', col('followingHas.followingId'))), 'count_following'],
    ],

    include: [
      {
        model: Recipe,
        as: 'recipesHas',
        attributes: [],
        required: false, // LEFT JOIN
      },
      {
        model: FavoriteRecipe,
        as: 'favoriteRecipesHas',
        attributes: [],
        required: false,
      },
      {
        model: UserFollowers,
        as: 'followersHas', // uf1 — users who follow this user
        attributes: [],
        required: false,
      },
      {
        model: UserFollowers,
        as: 'followingHas', // uf2 — users this user follows
        attributes: [],
        required: false,
      },
    ],

    group: ['user.id', 'user.avatar', 'user.name', 'user.email'],
  });
};

/**
 * Get user by ID
 *
 * @param {*} userId
 * @returns
 */
export const getUserById = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: Recipe,
        as: 'recipesHas',
        attributes: ['id'],
        where: { ownerId: userId },
        required: false,
      },
    ],
  });

  const followerCount = await UserFollowers.count({ where: { followingId: userId } });

  if (!user) {
    throw HttpError(404, 'User not found');
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    count_user_recipes: user.recipesHas.length,
    count_followers: followerCount,
  };
};

export const getFollowingsList = async (userId, limit = 5, page = 1) => {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: User,
        as: 'following',
        attributes: ['id', 'name', 'email', 'avatar'],
        through: { attributes: [] },
        include: [
          {
            model: Recipe,
            as: 'recipesHas',
            attributes: ['id', 'title', 'thumb'],
            limit: 4,
          },
        ],
      },
    ],
    limit: limit,
    offset: (page - 1) * limit,
  });

  const followingListWithRecipesCount = await Promise.all(
    user.following.map(async (user) => {
      const count = await Recipe.count({ where: { ownerId: user.id } });
      return { ...user.dataValues, recipesCount: count };
    })
  );

  return followingListWithRecipesCount;
};

export const getFollowersList = async (userId, limit = 5, page = 1) => {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: User,
        as: 'followers',
        attributes: ['id', 'name', 'email', 'avatar'],
        through: { attributes: [] },
        include: [
          {
            model: Recipe,
            as: 'recipesHas',
            attributes: ['id', 'title', 'thumb'],
            limit: 4,
          },
        ],
      },
    ],
    limit: limit,
    offset: (page - 1) * limit,
  });

  const followersListWithRecipesCount = await Promise.all(
    user.followers.map(async (user) => {
      const count = await Recipe.count({ where: { ownerId: user.id } });
      return { ...user.dataValues, recipesCount: count };
    })
  );

  return followersListWithRecipesCount;
};

// export const getFollowingsList = async (userId) => {
//   try {
//     const followings = await UserFollowers.findAll({
//       where: { followerId: userId },
//     });
//     const followingsIds = followings.map((follow) => follow.followingId);

//     const followingsUsersList = await User.findAll({
//       where: {
//         id: followingsIds,
//       },
//       attributes: ['id', 'name', 'avatar'],
//       include: [
//         {
//           model: Recipe,
//           as: 'recipes',
//           attributes: ['id', 'title', 'thumb'],
//         },
//       ],
//     });

//     const followingListWithRecipesCount = await Promise.all(
//       followingsUsersList.map(async (user) => {
//         const count = await Recipe.count({ where: { ownerId: user.id } });
//         return { ...user.dataValues, recipesCount: count };
//       })
//     );

//     return followingListWithRecipesCount;
//   } catch (error) {
//     throw error;
//   }
// };
