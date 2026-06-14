const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');
const paymentsController = require('../controllers/paymentsController');

//not protected routes because these are called by Razorpay and user doesn't have token at that time
//express raw is used to parse the raw body sent by Razorpay in webhook events
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentsController.handleWebhookEvents
);

// Protect all routes
router.use(authMiddleware.protect);

// Create order
router.post(
  '/create-order',
  authorizeMiddleware('payment:create'),
  paymentsController.createOrder
);

// Verify payment
router.post(
  '/verify-order',
  authorizeMiddleware('payment:create'),
  paymentsController.verifyOrder
);

// Create subscription
router.post(
  '/create-subscription',
  authorizeMiddleware('subscription:create'),
  paymentsController.createSubscription
);

// Capture subscription details after successful payment
router.post(
  '/capture-subscription',
  authorizeMiddleware('subscription:create'),
  paymentsController.captureSubscription
);

module.exports = router;
