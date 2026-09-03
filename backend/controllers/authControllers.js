import {
  ensureEmailIsNotVerified,
  getPasswordResetRequestUserId,
  registerUser,
  loginUser,
  resetUserPassword,
  refreshUser,
  updateAvatar,
  verifyUserEmail,
} from "../services/authServices.js";
import {
  enqueueEmailVerification,
  enqueuePasswordReset,
} from "../queues/shiftLifecycleQueue.js";

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

/**
 * Завжди повертає однакову відповідь, щоб не розкривати, чи існує акаунт
 * з конкретною email-адресою.
 */
export const forgotPasswordController = async (req, res) => {
  const userId = await getPasswordResetRequestUserId(req.body.email);

  if (userId) {
    // Не чекаємо SMTP: відповідь не повинна залежати від існування користувача
    // чи короткочасної доступності Valkey.
    void enqueuePasswordReset(userId).catch((error) => {
      console.error("[email] password reset job was not enqueued", {
        userId,
        message: error.message,
      });
    });
  }

  res.status(202).json({
    message: "Якщо акаунт з такою email-адресою існує, ми надіслали інструкції для відновлення пароля.",
  });
};

export const resetPasswordController = async (req, res) => {
  await resetUserPassword(req.body);
  // Поточний браузер також має увійти заново з новим паролем.
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.status(200).json({
    message: "Пароль успішно оновлено. Тепер увійдіть з новим паролем.",
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
