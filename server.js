import express from 'express';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';
import expressLayouts from 'express-ejs-layouts';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Route imports
import homeRoutes from './src/routes/home.js';
import productRoutes from './src/routes/products.js';
import collectionRoutes from './src/routes/collections.js';
import cartRoutes from './src/routes/cart.js';
import checkoutRoutes from './src/routes/checkout.js';
import adminRoutes from './src/routes/admin.js';
import apiRoutes from './src/routes/api.js';
import pageRoutes from './src/routes/pages.js';
import customerRoutes from './src/routes/customer.js';
import newsletterRoutes from './src/routes/newsletter.js';

// Config
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/akhdar-perfumes')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Stripe webhook needs raw body - must be before JSON parser
app.post('/checkout/webhook', express.raw({ type: 'application/json' }), (await import('./src/routes/checkout.js')).webhookHandler);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://cdn.tailwindcss.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride('_method'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'akhdar-perfumes-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/akhdar-perfumes',
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
  }
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
import { mkdirSync } from 'fs';
try { mkdirSync(path.join(__dirname, 'uploads'), { recursive: true }); } catch(e) {}
try { mkdirSync(path.join(__dirname, 'public/css'), { recursive: true }); } catch(e) {}
try { mkdirSync(path.join(__dirname, 'public/js'), { recursive: true }); } catch(e) {}
try { mkdirSync(path.join(__dirname, 'public/images'), { recursive: true }); } catch(e) {}

// Global variables middleware
app.use(async (req, res, next) => {
  // Cart data
  if (!req.session.cart) {
    req.session.cart = { items: [], total: 0, subtotal: 0, itemCount: 0 };
  }
  res.locals.cart = req.session.cart;
  
  // Site settings
  res.locals.settings = {
    siteName: 'Akhdar Perfumes',
    siteDescription: 'Premium Attar & Oud Roll-On Perfume Oils',
    currency: 'USD',
    currencySymbol: '$',
    logo: '/images/logo.png',
    logoInverse: '/images/logo-white.png',
    favicon: '/images/favicon.png'
  };

  // Current path for navigation
  res.locals.currentPath = req.path;

  // Customer auth
  res.locals.customer = req.session.customerId ? { id: req.session.customerId } : null;
  
  // Flash messages
  res.locals.success = req.session.success || null;
  res.locals.error = req.session.error || null;
  delete req.session.success;
  delete req.session.error;
  
  next();
});

// Routes
app.use('/', homeRoutes);
app.use('/products', productRoutes);
app.use('/collections', collectionRoutes);
app.use('/cart', cartRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);
app.use('/pages', pageRoutes);
app.use('/account', customerRoutes);
app.use('/newsletter', newsletterRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('pages/404', {
    title: 'Page Not Found - Akhdar Perfumes',
    layout: 'layouts/main'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/error', {
    title: 'Error - Akhdar Perfumes',
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    layout: 'layouts/main'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Akhdar Perfumes server running on port ${PORT}`);
  console.log(`   http://localhost:${PORT}`);
});

export default app;
