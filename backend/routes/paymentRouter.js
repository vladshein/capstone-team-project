import express from 'express';
import {
  createShiftInvoice,
  handleMonoWebhook,
  getWalletOverview,
  verifyInvoiceStatus,
  verifyShiftInvoice,
} from '../controllers/paymentControllers.js';
import authenticate from '../middlewares/authenticate.js';

const paymentRouter = express.Router();

paymentRouter.get('/wallet', authenticate, getWalletOverview);
paymentRouter.post('/invoice', authenticate, createShiftInvoice);
paymentRouter.post('/webhook', handleMonoWebhook);
paymentRouter.get('/verify/:invoiceId', authenticate, verifyInvoiceStatus);
paymentRouter.get('/verify-shift/:shiftId', authenticate, verifyShiftInvoice);

export default paymentRouter;