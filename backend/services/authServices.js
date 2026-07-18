import { User, Recipe, Area, Category } from '../db/models/index.js';
// import Recipe from '../db/models/Recipe.js';
// import Category from '../db/models/Recipe.js';
// import Area from '../db/models/Area.js';
import bcrypt from 'bcrypt';
import HttpError from '../helpers/HttpError.js';
import gravatar from 'gravatar';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { ObjectId } from 'bson';

import { createToken } from '../helpers/jwt.js';

const { JWT_SECRET } = process.env;
const avatarsPath = path.resolve('public', 'avatars');

export const findUser = async (where) => {
  return User.findOne({ where });
};

export const registerUser = async (payload) => {
  const avatar = gravatar.url(payload.email);
  const id = new ObjectId().toString();
  const hashPassword = await bcrypt.hash(payload.password, 10);
  return User.create({ ...payload, password: hashPassword, avatar, id });
};

export const loginUser = async ({ password, email }) => {
  const user = await findUser({ email });

  if (!user) {
    throw HttpError(401, 'Email or password invalid');
  }
  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, 'Email or password invalid');
  }

  const payload = {
    id: user.id,
  };

  const token = createToken(payload);
  console.log(token);

  await user.update({ token });
  return {
    token,
    id: user.id,
    email: user.email,
    avatar: user.avatar,
    name: user.name,
  };
};

export const refreshUser = async (user) => {
  const token = createToken({ id: user.id });

  await user.update({ token });
  return {
    id: user.id,
    email: user.email,
    avatar: user.avatar,
    name: user.name,
    token,
  };
};

export const logoutUser = async (user) => {
  await user.update({ token: null });
  return true;
};

export const updateAvatar = async (user, file) => {
  const { path: tempUpload, filename } = file;
  const resultUpload = path.join(avatarsPath, filename);

  await fs.rename(tempUpload, resultUpload);

  const avatar = path.join('avatars', filename).replace(/\\/g, '/');

  await user.update({ avatar });

  return { avatar };
};

export const getUserFollowers = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      {
        model: User,
        as: 'followers',
        attributes: ['id', 'name', 'email', 'avatar'],
        through: { attributes: [] },
      },
    ],
  });

  if (!user) {
    return [];
  }

  return user.followers;
};
