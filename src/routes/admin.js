import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Admin from '../models/Admin.js';
import Product from '../models/Product.js';
import Collection from '../models/Collection.js';
import Order from '../models/Order.js';
import Page from '../models/Page.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Auth middleware
const requireAdmin = async (req, res, next) => {
  if (!req.session.adminId) {
    return res.redirect('/admin/login');
  }
  try {
    const admin = await Admin.findById(req.session.adminId);
    if (!admin) {
      delete req.session.adminId;
      return res.redirect('/admin/login');
    }
    req.admin = admin;
    res.locals.admin = admin;
    next();
  } catch (error) {
    res.redirect('/admin/login');
  }
};

// Login page
router.get('/login', (req, res) => {
  if (req.session.adminId) {
    return res.redirect('/admin');
  }
  res.render('admin/login', {
    title: 'Admin Login - Akhdar Perfumes',
    layout: 'admin/layout-minimal'
  });
});

// Login process
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin || !(await admin.comparePassword(password))) {
      req.session.error = 'Invalid email or password';
      return res.redirect('/admin/login');
    }

    req.session.adminId = admin._id;
    admin.lastLogin = new Date();
    await admin.save();

    res.redirect('/admin');
  } catch (error) {
    console.error('Admin login error:', error);
    req.session.error = 'Login failed';
    res.redirect('/admin/login');
  }
});

// Logout
router.get('/logout', (req, res) => {
  delete req.session.adminId;
  res.redirect('/admin/login');
});

// Dashboard
router.get('/', requireAdmin, async (req, res) => {
  try {
    const [
      totalProducts,
      totalOrders,
      recentOrders,
      totalRevenue
    ] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(5),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ]);

    res.render('admin/dashboard', {
      title: 'Dashboard - Admin',
      totalProducts,
      totalOrders,
      recentOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('admin/dashboard', {
      title: 'Dashboard - Admin',
      error: 'Failed to load dashboard data'
    });
  }
});

// ============ PRODUCTS ============

// List products
router.get('/products', requireAdmin, async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate('collections');
    
    res.render('admin/products/index', {
      title: 'Products - Admin',
      products
    });
  } catch (error) {
    console.error('Products list error:', error);
    req.session.error = 'Failed to load products';
    res.redirect('/admin');
  }
});

// New product form
router.get('/products/new', requireAdmin, async (req, res) => {
  const collections = await Collection.find();
  res.render('admin/products/form', {
    title: 'New Product - Admin',
    product: null,
    collections
  });
});

// Create product
router.post('/products', requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const productData = {
      ...req.body,
      collections: req.body.collections ? 
        (Array.isArray(req.body.collections) ? req.body.collections : [req.body.collections]) : 
        [],
      tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [],
      images: req.files ? req.files.map((file, index) => ({
        url: `/uploads/${file.filename}`,
        alt: req.body.title,
        position: index
      })) : []
    };

    // Parse fragrance data
    if (req.body.topNotes) {
      productData.fragrance = {
        olfactiveFamily: req.body.olfactiveFamily,
        topNotes: req.body.topNotes.split(',').map(n => n.trim()),
        middleNotes: req.body.middleNotes ? req.body.middleNotes.split(',').map(n => n.trim()) : [],
        baseNotes: req.body.baseNotes ? req.body.baseNotes.split(',').map(n => n.trim()) : []
      };
    }

    const product = new Product(productData);
    await product.save();

    req.session.success = 'Product created successfully';
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Create product error:', error);
    req.session.error = 'Failed to create product: ' + error.message;
    res.redirect('/admin/products/new');
  }
});

// Edit product form
router.get('/products/:id/edit', requireAdmin, async (req, res) => {
  try {
    const [product, collections] = await Promise.all([
      Product.findById(req.params.id),
      Collection.find()
    ]);

    if (!product) {
      req.session.error = 'Product not found';
      return res.redirect('/admin/products');
    }

    res.render('admin/products/form', {
      title: 'Edit Product - Admin',
      product,
      collections
    });
  } catch (error) {
    console.error('Edit product error:', error);
    req.session.error = 'Failed to load product';
    res.redirect('/admin/products');
  }
});

// Update product
router.put('/products/:id', requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      req.session.error = 'Product not found';
      return res.redirect('/admin/products');
    }

    // Update basic fields
    Object.assign(product, {
      title: req.body.title,
      description: req.body.description,
      shortDescription: req.body.shortDescription,
      price: req.body.price,
      compareAtPrice: req.body.compareAtPrice || null,
      status: req.body.status,
      featured: req.body.featured === 'on',
      collections: req.body.collections ? 
        (Array.isArray(req.body.collections) ? req.body.collections : [req.body.collections]) : 
        [],
      tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : []
    });

    // Parse fragrance data
    if (req.body.topNotes) {
      product.fragrance = {
        olfactiveFamily: req.body.olfactiveFamily,
        topNotes: req.body.topNotes.split(',').map(n => n.trim()),
        middleNotes: req.body.middleNotes ? req.body.middleNotes.split(',').map(n => n.trim()) : [],
        baseNotes: req.body.baseNotes ? req.body.baseNotes.split(',').map(n => n.trim()) : []
      };
    }

    // Add new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: `/uploads/${file.filename}`,
        alt: product.title,
        position: product.images.length + index
      }));
      product.images.push(...newImages);
    }

    await product.save();

    req.session.success = 'Product updated successfully';
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Update product error:', error);
    req.session.error = 'Failed to update product: ' + error.message;
    res.redirect(`/admin/products/${req.params.id}/edit`);
  }
});

// Delete product
router.delete('/products/:id', requireAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    req.session.success = 'Product deleted successfully';
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Delete product error:', error);
    req.session.error = 'Failed to delete product';
    res.redirect('/admin/products');
  }
});

// ============ COLLECTIONS ============

router.get('/collections', requireAdmin, async (req, res) => {
  try {
    const collections = await Collection.find().sort({ createdAt: -1 });
    res.render('admin/collections/index', {
      title: 'Collections - Admin',
      collections
    });
  } catch (error) {
    req.session.error = 'Failed to load collections';
    res.redirect('/admin');
  }
});

router.get('/collections/new', requireAdmin, (req, res) => {
  res.render('admin/collections/form', {
    title: 'New Collection - Admin',
    collection: null
  });
});

router.post('/collections', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const collectionData = {
      ...req.body,
      published: req.body.published === 'on'
    };

    if (req.file) {
      collectionData.image = {
        url: `/uploads/${req.file.filename}`,
        alt: req.body.title
      };
    }

    const collection = new Collection(collectionData);
    await collection.save();

    req.session.success = 'Collection created successfully';
    res.redirect('/admin/collections');
  } catch (error) {
    console.error('Create collection error:', error);
    req.session.error = 'Failed to create collection';
    res.redirect('/admin/collections/new');
  }
});

router.get('/collections/:id/edit', requireAdmin, async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      req.session.error = 'Collection not found';
      return res.redirect('/admin/collections');
    }
    res.render('admin/collections/form', {
      title: 'Edit Collection - Admin',
      collection
    });
  } catch (error) {
    req.session.error = 'Failed to load collection';
    res.redirect('/admin/collections');
  }
});

router.put('/collections/:id', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      req.session.error = 'Collection not found';
      return res.redirect('/admin/collections');
    }

    Object.assign(collection, {
      title: req.body.title,
      description: req.body.description,
      published: req.body.published === 'on'
    });

    if (req.file) {
      collection.image = {
        url: `/uploads/${req.file.filename}`,
        alt: req.body.title
      };
    }

    await collection.save();
    req.session.success = 'Collection updated successfully';
    res.redirect('/admin/collections');
  } catch (error) {
    req.session.error = 'Failed to update collection';
    res.redirect(`/admin/collections/${req.params.id}/edit`);
  }
});

router.delete('/collections/:id', requireAdmin, async (req, res) => {
  try {
    await Collection.findByIdAndDelete(req.params.id);
    req.session.success = 'Collection deleted successfully';
    res.redirect('/admin/collections');
  } catch (error) {
    req.session.error = 'Failed to delete collection';
    res.redirect('/admin/collections');
  }
});

// ============ ORDERS ============

router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.render('admin/orders/index', {
      title: 'Orders - Admin',
      orders
    });
  } catch (error) {
    req.session.error = 'Failed to load orders';
    res.redirect('/admin');
  }
});

router.get('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      req.session.error = 'Order not found';
      return res.redirect('/admin/orders');
    }
    res.render('admin/orders/detail', {
      title: `Order ${order.orderNumber} - Admin`,
      order
    });
  } catch (error) {
    req.session.error = 'Failed to load order';
    res.redirect('/admin/orders');
  }
});

router.put('/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (req.body.fulfillmentStatus) {
      order.fulfillmentStatus = req.body.fulfillmentStatus;
    }
    if (req.body.trackingNumber) {
      order.trackingNumber = req.body.trackingNumber;
    }
    if (req.body.trackingUrl) {
      order.trackingUrl = req.body.trackingUrl;
    }

    await order.save();
    req.session.success = 'Order updated successfully';
    res.redirect(`/admin/orders/${req.params.id}`);
  } catch (error) {
    req.session.error = 'Failed to update order';
    res.redirect(`/admin/orders/${req.params.id}`);
  }
});

export default router;
