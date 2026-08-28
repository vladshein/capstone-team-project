import "dotenv/config";
import { verifyEmailTransport } from "../services/emailService.js";

try {
  await verifyEmailTransport();
  console.info("SMTP connection verified successfully.");
} catch (error) {
  // Не виводимо конфігурацію або пароль — лише безпечне повідомлення помилки.
  console.error("SMTP connection verification failed:", error.message);
  process.exitCode = 1;
}
