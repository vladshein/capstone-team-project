import express from "express";
import authenticate from "../middlewares/authenticate.js";
import checkRole from "../middlewares/checkRole.js";
import * as paymentController from "../controllers/paymentControllers.js";

const paymentRouter = express.Router();

// LiqPay надсилає form-urlencoded body, тому цей parser навмисне локальний.
paymentRouter.post("/liqpay/callback", express.urlencoded({ extended: false }), paymentController.liqPayCallback);
paymentRouter.use(authenticate);
paymentRouter.get("/me", paymentController.getMyPayments);
paymentRouter.post("/shifts/:shiftId/checkout", checkRole("business_client", "admin"), paymentController.createShiftCheckout);

export default paymentRouter;
