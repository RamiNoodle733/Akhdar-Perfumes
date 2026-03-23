import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

const subscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  subscribedAt: { type: Date, default: Date.now },
  active: { type: Boolean, default: true }
});

const Subscriber = mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);

router.post('/', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ error: 'Valid email required' });
      }
      req.session.error = 'Please enter a valid email address.';
      return res.redirect('back');
    }

    const existing = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (!existing.active) {
        existing.active = true;
        await existing.save();
      }
    } else {
      await Subscriber.create({ email: email.toLowerCase() });
    }

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, message: 'Thanks for subscribing!' });
    }
    
    req.session.success = 'Thanks for subscribing! We\'ll keep you updated with the latest news and offers.';
    res.redirect('back');
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ error: 'Subscription failed' });
    }
    req.session.error = 'Subscription failed. Please try again.';
    res.redirect('back');
  }
});

export default router;
