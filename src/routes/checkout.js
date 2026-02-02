import express from 'express';
import Stripe from 'stripe';
import Order from '../models/Order.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Checkout page
router.get('/', (req, res) => {
  const cart = req.session.cart;
  
  if (!cart || cart.items.length === 0) {
    return res.redirect('/cart');
  }

  res.render('pages/checkout', {
    title: 'Checkout - Akhdar Perfumes',
    cart,
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY || 'pk_test_placeholder'
  });
});

// Create payment intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const cart = req.session.cart;
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total in cents
    const amount = Math.round(cart.total * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        cartItems: JSON.stringify(cart.items.map(item => ({
          title: item.title,
          quantity: item.quantity,
          price: item.price
        })))
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Process order
router.post('/process', async (req, res) => {
  try {
    const cart = req.session.cart;
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const {
      email,
      firstName,
      lastName,
      address1,
      address2,
      city,
      state,
      zip,
      country,
      phone,
      paymentIntentId,
      customerNote
    } = req.body;

    // Create order
    const order = new Order({
      email,
      items: cart.items.map(item => ({
        product: item.productId,
        title: item.title,
        variant: item.variant,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      shippingAddress: {
        firstName,
        lastName,
        address1,
        address2,
        city,
        state,
        zip,
        country,
        phone
      },
      billingAddress: {
        firstName,
        lastName,
        address1,
        address2,
        city,
        state,
        zip,
        country,
        phone
      },
      subtotal: cart.subtotal,
      total: cart.total,
      stripePaymentIntentId: paymentIntentId,
      paymentStatus: 'paid',
      customerNote
    });

    await order.save();

    // Clear cart
    req.session.cart = { items: [], total: 0, itemCount: 0 };
    req.session.lastOrderId = order._id;

    res.json({ 
      success: true, 
      orderId: order._id,
      orderNumber: order.orderNumber
    });
  } catch (error) {
    console.error('Process order error:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// Order confirmation page
router.get('/confirmation', async (req, res) => {
  try {
    const orderId = req.session.lastOrderId;
    
    if (!orderId) {
      return res.redirect('/');
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.redirect('/');
    }

    // Clear the lastOrderId from session
    delete req.session.lastOrderId;

    res.render('pages/order-confirmation', {
      title: 'Order Confirmation - Akhdar Perfumes',
      order
    });
  } catch (error) {
    console.error('Confirmation page error:', error);
    res.redirect('/');
  }
});

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      // Update order status if needed
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      // Handle failed payment
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
