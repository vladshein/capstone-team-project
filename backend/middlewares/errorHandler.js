// import { UniqueConstraintError, ValidationError } from "sequelize";

// const errorHandler = (err, req, res, next) => {
//     if (err instanceof ValidationError) {
//         err.status = 400;
//     }

//     if (err instanceof UniqueConstraintError) {
//         err.status = 409;
//     }
//     const { status = 500, message = "Server error" } = err;
//     res.status(status).json({ message });
// };

// export default errorHandler;

import { UniqueConstraintError, ValidationError } from "sequelize";

const errorHandler = (err, req, res, next) => {
  // 1. Помилки валідації Joi (якщо validateBody передає помилку в next)
  if (err.isJoi) {
    return res.status(400).json({
      message: "Помилка формату даних (Joi)",
      details: err.details.map((d) => d.message).join(", "),
    });
  }

  // 2. Помилки валідації БД (Sequelize)
  if (err instanceof ValidationError) {
    // Дістаємо всі конкретні повідомлення з масиву помилок Sequelize
    const messages = err.errors.map((e) => e.message).join(", ");
    return res.status(400).json({
      message: "Помилка валідації БД (Sequelize)",
      details: messages,
    });
  }

  // 3. Помилки унікальності (Sequelize)
  if (err instanceof UniqueConstraintError) {
    return res.status(409).json({
      message: "Конфлікт даних",
      details: err.errors[0].message,
    });
  }

  // 4. Кастомні помилки (наші 404, 403 тощо)
  const status = err.status || 500;
  const message = err.message || "Внутрішня помилка сервера";

  // Логуємо 500-ті помилки в консоль для дебагу
  if (status === 500) console.error("Server Error:", err);

  res.status(status).json({ message });
};

export default errorHandler;
