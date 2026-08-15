import { Op } from "sequelize";
import { User, WorkerProfile } from "../db/models/index.js";
import bcrypt from "bcrypt";
import HttpError from "../helpers/HttpError.js";
import gravatar from "gravatar";
import * as fs from "node:fs/promises";
import path from "node:path";
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../helpers/jwt.js";

const avatarsPath = path.resolve("public", "avatars");

const buildAuthResponse = (
  user,
  token,
  displayName = user.name || user.email,
) => ({
  user: {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: displayName || user.email,
    avatarUrl: user.avatar,
    phone: user.phone,
    isVerified: user.isVerified,
  },
  accessToken: token,
});

export const findUser = async (where) => {
  return User.findOne({ where });
};

const getDisplayName = async (user) => {
  if (user.role !== "worker") {
    return user.name || user.email;
  }

  const workerProfile = await WorkerProfile.findOne({
    where: { userId: user.id },
    attributes: ["firstName", "lastName"],
  });

  return workerProfile
    ? `${workerProfile.firstName} ${workerProfile.lastName}`.trim()
    : user.email;
};

export const registerUser = async (payload) => {
  const { email, phone, password, role } = payload;
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

  const accessToken = createAccessToken({ id: newUser.id });
  const refreshToken = createRefreshToken({ id: newUser.id });

  return { ...buildAuthResponse(newUser, accessToken), refreshToken };
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

  const accessToken = createAccessToken({ id: user.id });
  const refreshToken = createRefreshToken({ id: user.id });
  const displayName = await getDisplayName(user);

  return { ...buildAuthResponse(user, accessToken, displayName), refreshToken };
};

export const refreshUser = async (token) => {
  if (!token) {
    throw HttpError(401, "No refresh token");
  }

  const { data, error } = verifyRefreshToken(token);
  if (error) {
    throw HttpError(401, "Invalid refresh token");
  }

  const user = await findUser({ id: data.id });
  if (!user) {
    throw HttpError(401, "User not found");
  }

  const accessToken = createAccessToken({ id: user.id });
  const refreshToken = createRefreshToken({ id: user.id });
  const displayName = await getDisplayName(user);

  return { ...buildAuthResponse(user, accessToken, displayName), refreshToken };
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
