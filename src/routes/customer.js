import express from 'express';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';

const router = express.Router();

const requireCustomer = async (req, res, next) => {
  if (!req.session.customerId) {
    return res.redirect('/account/login');
  }
  try {
    const customer = await Customer.findById(req.session.customerId);
    if (!customer) {
      delete req.session.customerId;
      return res.redirect('/account/login');
    }
    req.customer = customer;
    res.locals.customer = customer;
    next();
  } catch (error) {
    res.redirect('/account/login');
  }
};

router.get('/register', (req, res) => {
  if (req.session.customerId) return res.redirect('/account');
  res.render('pages/account/register', {
    title: 'Create Account - Akhdar Perfumes'
  });
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, acceptsMarketing } = req.body;
    
    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) {
      req.session.error = 'An account with this email already exists.';
      return res.redirect('/account/register');
    }

    const customer = new Customer({
      email,
      password,
      firstName,
      lastName,
      acceptsMarketing: acceptsMarketing === 'on'
    });

    await customer.save();
    req.session.customerId = customer._id;
    req.session.success = 'Account created successfully! Welcome to Akhdar Perfumes.';
    res.redirect('/account');
  } catch (error) {
    console.error('Registration error:', error);
    req.session.error = 'Registration failed. Please try again.';
    res.redirect('/account/register');
  }
});

router.get('/login', (req, res) => {
  if (req.session.customerId) return res.redirect('/account');
  res.render('pages/account/login', {
    title: 'Login - Akhdar Perfumes'
  });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const customer = await Customer.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!customer || !(await customer.comparePassword(password))) {
      req.session.error = 'Invalid email or password.';
      return res.redirect('/account/login');
    }

    req.session.customerId = customer._id;
    req.session.success = `Welcome back, ${customer.firstName}!`;
    res.redirect('/account');
  } catch (error) {
    console.error('Login error:', error);
    req.session.error = 'Login failed. Please try again.';
    res.redirect('/account/login');
  }
});

router.get('/logout', (req, res) => {
  delete req.session.customerId;
  req.session.success = 'You have been logged out.';
  res.redirect('/');
});

router.get('/', requireCustomer, async (req, res) => {
  try {
    const recentOrders = await Order.find({ 
      $or: [
        { customer: req.customer._id },
        { email: req.customer.email }
      ]
    }).sort({ createdAt: -1 }).limit(5);
    
    res.render('pages/account/dashboard', {
      title: 'My Account - Akhdar Perfumes',
      customer: req.customer,
      recentOrders
    });
  } catch (error) {
    console.error('Account page error:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      error: 'Failed to load account'
    });
  }
});

router.get('/orders', requireCustomer, async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        { customer: req.customer._id },
        { email: req.customer.email }
      ]
    }).sort({ createdAt: -1 });
    
    res.render('pages/account/orders', {
      title: 'Order History - Akhdar Perfumes',
      customer: req.customer,
      orders
    });
  } catch (error) {
    console.error('Orders page error:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      error: 'Failed to load orders'
    });
  }
});

router.get('/orders/:id', requireCustomer, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      $or: [
        { customer: req.customer._id },
        { email: req.customer.email }
      ]
    });
    
    if (!order) {
      return res.status(404).render('pages/404', {
        title: 'Order Not Found - Akhdar Perfumes'
      });
    }
    
    res.render('pages/account/order-detail', {
      title: `Order #${order.orderNumber} - Akhdar Perfumes`,
      customer: req.customer,
      order
    });
  } catch (error) {
    console.error('Order detail error:', error);
    res.redirect('/account/orders');
  }
});

router.get('/addresses', requireCustomer, (req, res) => {
  res.render('pages/account/addresses', {
    title: 'Addresses - Akhdar Perfumes',
    customer: req.customer
  });
});

router.post('/addresses', requireCustomer, async (req, res) => {
  try {
    const { firstName, lastName, address1, address2, city, state, zip, country, phone, isDefault } = req.body;
    
    if (isDefault === 'on') {
      req.customer.addresses.forEach(addr => { addr.isDefault = false; });
    }
    
    req.customer.addresses.push({
      firstName, lastName, address1, address2, city, state, zip,
      country: country || 'US', phone,
      isDefault: isDefault === 'on' || req.customer.addresses.length === 0
    });
    
    await req.customer.save();
    req.session.success = 'Address added successfully.';
    res.redirect('/account/addresses');
  } catch (error) {
    console.error('Add address error:', error);
    req.session.error = 'Failed to add address.';
    res.redirect('/account/addresses');
  }
});

router.post('/profile', requireCustomer, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    req.customer.firstName = firstName;
    req.customer.lastName = lastName;
    req.customer.phone = phone;
    await req.customer.save();
    req.session.success = 'Profile updated successfully.';
    res.redirect('/account');
  } catch (error) {
    console.error('Profile update error:', error);
    req.session.error = 'Failed to update profile.';
    res.redirect('/account');
  }
});

export default router;
