import jwt from "jsonwebtoken";
const { JWT_SECRET } = process.env;

export const createToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
};

export const verifyToken = (token) => {
    try {
        const data = jwt.verify(token, JWT_SECRET);
        return { data, error: null };
    } catch (error) {
        return { error, data: null };
    }
};
