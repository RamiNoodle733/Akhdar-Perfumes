import express from 'express';
import Product from '../models/Product.js';
import Collection from '../models/Collection.js';

const router = express.Router();

// Home page
router.get('/', async (req, res) => {
  try {
    // Get featured products
    const featuredProducts = await Product.find({ 
      status: 'active',
      featured: true 
    }).limit(8).populate('collections');

    // Get all products for product grid
    const allProducts = await Product.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(8);

    // Get collections for display
    const collections = await Collection.find({ published: true }).limit(4);

    res.render('pages/home', {
      title: 'Akhdar Perfumes - Premium Attar & Oud Roll-On Perfume Oils',
      featuredProducts,
      products: allProducts,
      collections
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.status(500).render('pages/error', { 
      title: 'Error',
      error: 'Failed to load home page' 
    });
  }
});

// Search page
router.get('/search', async (req, res) => {
  try {
    const { q, sort = 'relevance' } = req.query;
    
    if (!q) {
      return res.render('pages/search', {
        title: 'Search - Akhdar Perfumes',
        query: '',
        products: [],
        total: 0
      });
    }

    let sortOption = {};
    switch (sort) {
      case 'price-asc':
        sortOption = { price: 1 };
        break;
      case 'price-desc':
        sortOption = { price: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'title-asc':
        sortOption = { title: 1 };
        break;
      default:
        sortOption = { score: { $meta: 'textScore' } };
    }

    const products = await Product.find(
      { 
        $text: { $search: q },
        status: 'active'
      },
      { score: { $meta: 'textScore' } }
    ).sort(sortOption).limit(50);

    res.render('pages/search', {
      title: `Search results for "${q}" - Akhdar Perfumes`,
      query: q,
      products,
      total: products.length,
      sort
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      error: 'Search failed'
    });
  }
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('pages/contact', {
    title: 'Contact Us - Akhdar Perfumes'
  });
});

// Contact form submission
router.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Here you would typically send an email or save to database
    // For now, we'll just flash a success message
    
    console.log('Contact form submission:', { name, email, message });
    
    req.session.success = 'Thank you for your message! We will get back to you soon.';
    res.redirect('/contact');
  } catch (error) {
    console.error('Contact form error:', error);
    req.session.error = 'Failed to send message. Please try again.';
    res.redirect('/contact');
  }
});

export default router;
