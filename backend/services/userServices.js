import {
  Shift,
  User,
  // FavoriteRecipe,
  // UserFollowers,
} from "../db/models/index.js";
import { fn, col } from "sequelize";
import HttpError from "../helpers/HttpError.js";

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
      "id",
      "avatar",
      "name",
      "email",
    ],

    group: ["user.id", "user.avatar", "user.name", "user.email"],
  });
};

/**
 * Get user by ID
 *
 * @param {*} userId
 * @returns
 */
// export const getUserById = async (userId) => {
//   const user = await User.findByPk(userId, {
//     include: [
//       {
//         model: Recipe,
//         as: "recipesHas",
//         attributes: ["id"],
//         where: { ownerId: userId },
//         required: false,
//       },
//     ],
//   });

//   const followerCount = await UserFollowers.count({
//     where: { followingId: userId },
//   });

//   if (!user) {
//     throw HttpError(404, "User not found");
//   }
//   return {
//     id: user.id,
//     name: user.name,
//     email: user.email,
//     avatar: user.avatar,
//     count_user_recipes: user.recipesHas.length,
//     count_followers: followerCount,
//   };
// };
