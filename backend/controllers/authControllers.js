import {
  registerUser,
  loginUser,
  refreshUser,
  logoutUser,
  updateAvatar,
  getUserFollowers,
} from "../services/authServices.js";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/api/auth",
};

export const registerController = async (req, res) => {
  const { refreshToken, ...result } = await registerUser(req.body);
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
  res.status(201).json(result);
};

export const loginController = async (req, res) => {
  const { refreshToken, ...result } = await loginUser(req.body);
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
  res.json(result);
};

export const refreshController = async (req, res) => {
  const token = req.cookies.refreshToken;
  const { refreshToken, ...result } = await refreshUser(token);
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
  res.json(result);
};

export const logoutController = async (req, res) => {
  await logoutUser(req.user);
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.status(204).send();
};

export const updateAvatarController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
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
