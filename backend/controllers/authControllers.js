import {
  ensureEmailIsNotVerified,
  registerUser,
  loginUser,
  refreshUser,
  updateAvatar,
  getUserFollowers,
  verifyUserEmail,
} from "../services/authServices.js";
import { enqueueEmailVerification } from "../queues/shiftLifecycleQueue.js";

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

  // Реєстрація не чекає на SMTP. Якщо Valkey тимчасово недоступний, користувач
  // бачить банер і може повторно надіслати лист із власного кабінету.
  void enqueueEmailVerification(result.user.id).catch((error) => {
    console.error("[email] verification job was not enqueued", {
      userId: result.user.id,
      message: error.message,
    });
  });
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
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.status(204).send();
};

export const verifyEmailController = async (req, res) => {
  const result = await verifyUserEmail(req.body.token);
  res.status(200).json({
    message: result.alreadyVerified
      ? "Email уже був підтверджений."
      : "Email успішно підтверджено.",
    ...result,
  });
};

export const resendEmailVerificationController = async (req, res) => {
  await ensureEmailIsNotVerified(req.user.id);
  await enqueueEmailVerification(req.user.id);

  res.status(202).json({
    message: "Лист для підтвердження надіслано повторно.",
  });
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
