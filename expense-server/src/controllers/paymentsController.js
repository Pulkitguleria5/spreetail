const Razorpay = require('razorpay');
const crypto = require('crypto');
const Users = require('../model/users');
const { CREDIT_TO_PAISA_MAPPING, PLAN_IDS } = require('../constants/paymentConstants');

const razorpayClient = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const paymentsController = {

  // Create Razorpay Order
  createOrder: async (request, response) => {
    try {
      const { credits } = request.body;

      // Validate credits
      if (!CREDIT_TO_PAISA_MAPPING[credits]) {
        return response.status(400).json({
          message: 'Invalid credit value'
        });
      }

      const amountInPaise = CREDIT_TO_PAISA_MAPPING[credits];

      const order = await razorpayClient.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`
      });

      return response.json({ order });

    } catch (error) {
      return response.status(500).json({ message: 'Internal server error' });
    }
  },

  // Verify Payment
  verifyOrder: async (request, response) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        credits
      } = request.body;

      const body = razorpay_order_id + "|" + razorpay_payment_id;

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return response.status(400).json({ message: "Invalid transaction" });
      }

      const user = await Users.findByPk(request.user.id);
      user.credits += Number(credits);
      await user.save();


      return response.json({ user });

    } catch (error) {
      return response.status(500).json({ message: 'Internal server error' });
    }
  },



  createSubscription: async (request, response) => {
    try {
      const { plan_name } = request.body;

      if (!PLAN_IDS[plan_name]) {
        return response.status(400).json({
          message: 'Invalid plan selected'
        });
      }

      const plan = PLAN_IDS[plan_name];

      const subscription = await razorpayClient.subscriptions.create({
        plan_id: plan.id,
        customer_notify: 1,
        total_count: plan.totalBillingCycleCount,
        notes: {
          userId: request.user.id
        }
      });

      return response.json({ subscription });
    } catch (error) {
      console.log(error);
      return response.status(500).json({ message: 'Internal server error' });
    }
  },

  captureSubscription: async (request, response) => {
    try {
      const { subscriptionId } = request.body;

      const subscription = await razorpayClient.subscriptions.fetch(subscriptionId);

      const user = await Users.findByPk(request.user.id);

      user.subscription = {
        subscriptionId: subscriptionId,
        planId: subscription.plan_id,
        status: subscription.status
      };

      await user.save();

      response.json({ user });
    } catch (error) {
      console.log(error);
      return response.status(500).json({ message: 'Internal server error' });
    }
  },


  handleWebhookEvents: async (request, response) => {
    try {
      console.log('Received Event');

      const signature = request.headers['x-razorpay-signature'];
      const body = request.body;

      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (expectedSignature !== signature) {
        return response.status(400).send('Invalid signature');
      }

      const payload = JSON.parse(body);
      const event = payload.event;

      const subscriptionData = payload.payload.subscription.entity;
      const razorpaySubscriptionId = subscriptionData.id;
      const userId = subscriptionData.notes?.userId;

      if (!userId) {
        return response.status(400).send('UserID not found in notes');
      }

      let newStatus;

      switch (event) {
        case 'subscription.activated':
          newStatus = 'active';
          break;

        case 'subscription.pending':
          newStatus = 'pending';
          break;

        case 'subscription.cancelled':
          newStatus = 'cancelled';
          break;

        case 'subscription.completed':
          newStatus = 'completed';
          break;

        default:
          return response.status(200).send(`Unhandled event received: ${event}`);
      }

      const user = await Users.findByPk(userId);
      if (user) {
        await user.update({
          subscriptionId: razorpaySubscriptionId,
          subscriptionStatus: newStatus,
          subscriptionPlanId: subscriptionData.plan_id,
          subscriptionStart: subscriptionData.start_at
            ? new Date(subscriptionData.start_at * 1000)
            : null,
          subscriptionEnd: subscriptionData.end_at
            ? new Date(subscriptionData.end_at * 1000)
            : null,
          subscriptionLastBillDate: subscriptionData.current_start
            ? new Date(subscriptionData.current_start * 1000)
            : null,
          subscriptionNextBillDate: subscriptionData.current_end
            ? new Date(subscriptionData.current_end * 1000)
            : null,
          subscriptionPaymentsMade: subscriptionData.paid_count,
          subscriptionPaymentsRemaining: subscriptionData.remaining_count
        });
      }

      if (!user) {
        return response.status(400).send('No user found');
      }
      console.log(`Updated subscription status for the user ${user.email} to ${newStatus}`);

      return response.status(200).send(`Event processed for user: ${user.email}`);
    } catch (error) {
      console.log(error);
      return response.status(500).send('Internal server error');
    }
  }
};

module.exports = paymentsController;



//NOTE: If you are using ngrok, then remember that ngrok generates a new URL everytime you run it. So you’ll have to go back to Razorpay and edit the Webhook URL.