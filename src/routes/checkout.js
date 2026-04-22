import express from 'express';
import Stripe from 'stripe';
import Order from '../models/Order.js';
import { sendOrderConfirmation } from '../utils/email.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const SHIPPING_RATES = {
  standard: { label: 'Standard Shipping (5-7 days)', price: 9.99 },
  express: { label: 'Express Shipping (2-3 days)', price: 19.99 },
  overnight: { label: 'Overnight Shipping (next day)', price: 29.99 }
};

const TAX_RATE = 0.0825;
const FREE_SHIPPING_THRESHOLD = 75;

function calculateOrderTotals(cart, shippingMethod) {
  const subtotal = cart.subtotal || cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let shippingCost = SHIPPING_RATES[shippingMethod]?.price || SHIPPING_RATES.standard.price;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    shippingCost = 0;
  }
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + shippingCost + tax) * 100) / 100;
  return { subtotal, shippingCost, tax, total };
}

router.get('/', (req, res) => {
  const cart = req.session.cart;
  
  if (!cart || cart.items.length === 0) {
    return res.redirect('/cart');
  }

  res.render('pages/checkout', {
    title: 'Checkout - Akhdar Perfumes',
    cart,
    stripePublicKey: process.env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLIC_KEY || 'pk_test_placeholder',
    shippingRates: SHIPPING_RATES,
    taxRate: TAX_RATE,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD
  });
});

router.post('/create-payment-intent', async (req, res) => {
  try {
    const cart = req.session.cart;
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const { email, shippingAddress, shippingMethod = 'standard' } = req.body;
    const { subtotal, shippingCost, tax, total } = calculateOrderTotals(cart, shippingMethod);
    const amount = Math.round(total * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      receipt_email: email,
      metadata: {
        shippingMethod,
        shippingCost: shippingCost.toString(),
        tax: tax.toString(),
        subtotal: subtotal.toString(),
        itemCount: cart.items.length.toString()
      }
    });

    req.session.pendingOrder = {
      email,
      shippingAddress,
      shippingMethod,
      shippingCost,
      tax,
      subtotal,
      total,
      paymentIntentId: paymentIntent.id
    };

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

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
      shippingMethod,
      customerNote
    } = req.body;

    const { subtotal, shippingCost, tax, total } = calculateOrderTotals(cart, shippingMethod || 'standard');

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
        address2: address2 || '',
        city,
        state,
        zip,
        country: country || 'US',
        phone: phone || ''
      },
      billingAddress: {
        firstName,
        lastName,
        address1,
        address2: address2 || '',
        city,
        state,
        zip,
        country: country || 'US',
        phone: phone || ''
      },
      subtotal,
      shipping: shippingCost,
      tax,
      total,
      shippingMethod: SHIPPING_RATES[shippingMethod]?.label || 'Standard Shipping',
      stripePaymentIntentId: paymentIntentId,
      paymentStatus: 'paid',
      paymentMethod: 'card',
      customerNote: customerNote || '',
      customer: req.session.customerId || undefined
    });

    await order.save();

    sendOrderConfirmation(order).catch(err => console.error('Email send error:', err));

    req.session.cart = { items: [], total: 0, subtotal: 0, itemCount: 0 };
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

router.get('/confirmation', async (req, res) => {
  try {
    const orderId = req.query.order || req.session.lastOrderId;
    
    if (!orderId) {
      return res.redirect('/');
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.redirect('/');
    }

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

export const webhookHandler = async (req, res) => {
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

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      try {
        const order = await Order.findOne({ stripePaymentIntentId: paymentIntent.id });
        if (order && order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          await order.save();
        }
      } catch (e) {
        console.error('Webhook order update error:', e);
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      try {
        const order = await Order.findOne({ stripePaymentIntentId: failedPayment.id });
        if (order) {
          order.paymentStatus = 'failed';
          await order.save();
        }
      } catch (e) {
        console.error('Webhook order update error:', e);
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

export default router;
