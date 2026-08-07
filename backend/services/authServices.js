import { Op } from "sequelize";
import { User } from "../db/models/index.js";
import bcrypt from "bcrypt";
import HttpError from "../helpers/HttpError.js";
import gravatar from "gravatar";
import * as fs from "node:fs/promises";
import path from "node:path";
import { createToken } from "../helpers/jwt.js";

const { JWT_SECRET } = process.env;
const avatarsPath = path.resolve("public", "avatars");

// const toDatabaseRole = (role) => {
//   if (role === "business") {
//     return "business_client";
//   }

//   return role || "worker";
// };

// const toClientRole = (role) => {
//   if (role === "business_client") {
//     return "business_client";
//   }

//   return role;
// };

const buildAuthResponse = (user, token) => ({
  user: {
    id: user.id,
    email: user.email,
    // role: toClientRole(user.role),
    role: user.role,
    displayName: user.name || user.email,
    avatarUrl: user.avatar,
    balance: 0,
    phone: user.phone,
    isVerified: user.isVerified,
  },
  accessToken: token,
});

export const findUser = async (where) => {
  return User.findOne({ where });
};

export const registerUser = async (payload) => {
  const { email, phone, password, role } = payload;
  // const databaseRole = toDatabaseRole(role);
  const databaseRole = role;

  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ email }, { phone }],
    },
  });

  if (existingUser) {
    const isEmailConflict = existingUser.email === email;
    const message = isEmailConflict
      ? "Email вже використовується"
      : "Номер телефону вже використовується";

    const error = new Error(message);
    error.status = 409;
    throw error;
  }

  const avatar = gravatar.url(payload.email);
  const passwordHash = await bcrypt.hash(payload.password, 10);

  const newUser = await User.create({
    email,
    phone,
    passwordHash,
    avatar,
    role: databaseRole,
  });

  const accessToken = createToken({ id: newUser.id });

  await newUser.update({ token: accessToken });

  return buildAuthResponse(newUser, accessToken);
};

export const loginUser = async ({ password, email }) => {
  const user = await findUser({ email });

  if (!user) {
    throw HttpError(401, "Email or password invalid");
  }
  const passwordCompare = await bcrypt.compare(password, user.passwordHash);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password invalid");
  }

  const payload = {
    id: user.id,
  };

  const accessToken = createToken(payload);

  await user.update({ token: accessToken });
  return buildAuthResponse(user, accessToken);
};

export const refreshUser = async (user) => {
  const accessToken = createToken({ id: user.id });
  await user.update({ token: accessToken });

  return buildAuthResponse(user, accessToken);
};

export const logoutUser = async (user) => {
  await user.update({ token: null });
  return true;
};

export const updateAvatar = async (user, file) => {
  const { path: tempUpload, filename } = file;
  const resultUpload = path.join(avatarsPath, filename);

  await fs.rename(tempUpload, resultUpload);

  const avatar = path.join("avatars", filename).replace(/\\/g, "/");

  await user.update({ avatar });

  return { avatar };
};

export const getUserFollowers = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: User,
        as: "followers",
        attributes: ["id", "name", "email", "avatar"],
        through: { attributes: [] },
      },
    ],
  });

  if (!user) {
    return [];
  }

  return user.followers;
};
