import Stripe from 'stripe';
import config from '../configs/config.js';

const stripe = new Stripe(config.stripe.secret_key);

export const createStripeCheckoutSession = async (userId, planName, email, additionalMetadata = {}) => {
  try {
    const plan = config.plans[planName.toLowerCase()];

    if (!plan || plan.price === 0) {
      throw new Error('Invalid plan or free plan cannot be processed');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `SynapseCode ${planName} Plan`,
              description: `Subscription to ${planName} plan`,
            },
            unit_amount: plan.price,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${config.email.frontend_url}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.email.frontend_url}/subscription/cancel`,
      metadata: {
        userId,
        planName,
        ...additionalMetadata,
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    throw error;
  }
};

export const createStripeCustomer = async (email, name) => {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
    });

    return customer;
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    throw error;
  }
};

export const handleStripeWebhook = async (event) => {
  switch (event.type) {
    case 'checkout.session.completed':
      console.log('Payment successful:', event.data.object);
      return { success: true, event: 'checkout.session.completed' };
    case 'invoice.payment_failed':
      console.log('Payment failed:', event.data.object);
      return { success: false, event: 'invoice.payment_failed' };
    case 'customer.subscription.deleted':
      console.log('Subscription cancelled:', event.data.object);
      return { success: true, event: 'customer.subscription.deleted' };
    default:
      return { success: true, event: 'unknown' };
  }
};

export default {
  createStripeCheckoutSession,
  createStripeCustomer,
  handleStripeWebhook,
};
