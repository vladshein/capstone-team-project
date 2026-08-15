import jwt from "jsonwebtoken";
const { JWT_SECRET, JWT_REFRESH_SECRET } = process.env;

export const createAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
};

export const createRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

const verifyWith = (token, secret) => {
  try {
    const data = jwt.verify(token, secret);
    return { data, error: null };
  } catch (error) {
    return { error, data: null };
  }
};

export const verifyAccessToken = (token) => verifyWith(token, JWT_SECRET);
export const verifyRefreshToken = (token) => verifyWith(token, JWT_REFRESH_SECRET);
