import {
  registerUser,
  loginUser,
  refreshUser,
  logoutUser,
  updateAvatar,
  getUserFollowers,
} from '../services/authServices.js';
export const registerController = async (req, res) => {
  const newUser = await registerUser(req.body);

  res.status(201).json({
    email: newUser.email,
  });
};

export const loginController = async (req, res) => {
  const result = await loginUser(req.body);
  res.json(result);
};

export const getCurrentController = async (req, res) => {
  // const { email } = req.user;
  const result = await refreshUser(req.user);
  res.json(result);
};

export const logoutController = async (req, res) => {
  await logoutUser(req.user);
  res.status(204).send();
};

export const updateAvatarController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const result = await updateAvatar(req.user, req.file);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getFollowersController = async (req, res) => {
  const { id } = req.user;

  const followers = await getUserFollowers(id);

  res.status(200).json({
    followers,
  });
};
