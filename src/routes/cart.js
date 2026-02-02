import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// Helper to calculate cart totals
const calculateCartTotals = (cart) => {
  cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  cart.total = cart.subtotal; // Add shipping/tax later
  return cart;
};

// View cart
router.get('/', (req, res) => {
  const cart = req.session.cart || { items: [], total: 0, itemCount: 0 };
  
  res.render('pages/cart', {
    title: 'Your Cart - Akhdar Perfumes',
    cart
  });
});

// Add to cart
router.post('/add', async (req, res) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Initialize cart if doesn't exist
    if (!req.session.cart) {
      req.session.cart = { items: [], total: 0, itemCount: 0 };
    }

    const cart = req.session.cart;
    
    // Check if item already in cart
    const existingIndex = cart.items.findIndex(
      item => item.productId.toString() === productId && 
              ((!variantId && !item.variantId) || item.variantId === variantId)
    );

    let price = product.price;
    let variantName = null;
    let image = product.featuredImage?.url || (product.images[0]?.url);

    // If variant specified, get variant price
    if (variantId) {
      const variant = product.variants.id(variantId);
      if (variant) {
        price = variant.price;
        variantName = variant.name;
        if (variant.image) {
          image = variant.image;
        }
      }
    }

    if (existingIndex > -1) {
      // Update quantity
      cart.items[existingIndex].quantity += parseInt(quantity);
    } else {
      // Add new item
      cart.items.push({
        productId: product._id,
        variantId: variantId || null,
        title: product.title,
        variant: variantName,
        price,
        quantity: parseInt(quantity),
        image,
        handle: product.handle
      });
    }

    // Recalculate totals
    calculateCartTotals(cart);
    
    // Save to session
    req.session.cart = cart;

    // Check if AJAX request
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ 
        success: true, 
        cart,
        message: 'Added to cart!'
      });
    }

    req.session.success = `${product.title} added to cart!`;
    res.redirect('/cart');
  } catch (error) {
    console.error('Add to cart error:', error);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ error: 'Failed to add to cart' });
    }
    req.session.error = 'Failed to add to cart';
    res.redirect('back');
  }
});

// Update cart item quantity
router.post('/update', (req, res) => {
  try {
    const { index, quantity } = req.body;
    
    if (!req.session.cart) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const cart = req.session.cart;
    
    if (index < 0 || index >= cart.items.length) {
      return res.status(400).json({ error: 'Invalid item' });
    }

    if (quantity <= 0) {
      // Remove item
      cart.items.splice(index, 1);
    } else {
      cart.items[index].quantity = parseInt(quantity);
    }

    calculateCartTotals(cart);
    req.session.cart = cart;

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, cart });
    }

    res.redirect('/cart');
  } catch (error) {
    console.error('Update cart error:', error);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ error: 'Failed to update cart' });
    }
    req.session.error = 'Failed to update cart';
    res.redirect('/cart');
  }
});

// Remove from cart
router.post('/remove', (req, res) => {
  try {
    const { index } = req.body;
    
    if (!req.session.cart) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const cart = req.session.cart;
    
    if (index < 0 || index >= cart.items.length) {
      return res.status(400).json({ error: 'Invalid item' });
    }

    cart.items.splice(index, 1);
    calculateCartTotals(cart);
    req.session.cart = cart;

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, cart });
    }

    res.redirect('/cart');
  } catch (error) {
    console.error('Remove from cart error:', error);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ error: 'Failed to remove item' });
    }
    req.session.error = 'Failed to remove item';
    res.redirect('/cart');
  }
});

// Clear cart
router.post('/clear', (req, res) => {
  req.session.cart = { items: [], total: 0, itemCount: 0 };
  
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ success: true, cart: req.session.cart });
  }

  res.redirect('/cart');
});

// Get cart JSON (for AJAX updates)
router.get('/json', (req, res) => {
  const cart = req.session.cart || { items: [], total: 0, itemCount: 0 };
  res.json(cart);
});

export default router;
