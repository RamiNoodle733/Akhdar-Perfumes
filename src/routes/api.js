import express from 'express';
import Product from '../models/Product.js';
import Collection from '../models/Collection.js';

const router = express.Router();

// Predictive search API (used by search modal)
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 6 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ products: [], collections: [] });
    }

    const [products, collections] = await Promise.all([
      Product.find(
        { $text: { $search: q }, status: 'active' },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(parseInt(limit))
        .select('title handle price images'),
      Collection.find({
        title: { $regex: q, $options: 'i' },
        published: true
      }).limit(4).select('title handle')
    ]);

    res.json({ products, collections });
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ products: [], collections: [], error: 'Search failed' });
  }
});

// Search products API
router.get('/products/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ products: [] });
    }

    const products = await Product.find(
      { 
        $text: { $search: q },
        status: 'active'
      },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit))
      .select('title handle price images');

    res.json({ products });
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get single product API
router.get('/products/:handle', async (req, res) => {
  try {
    const product = await Product.findOne({ 
      handle: req.params.handle,
      status: 'active'
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Product API error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get products by collection
router.get('/collections/:handle/products', async (req, res) => {
  try {
    const { limit = 12, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const collection = await Collection.findOne({ handle: req.params.handle });
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const products = await Product.find({
      collections: collection._id,
      status: 'active'
    })
      .skip(skip)
      .limit(parseInt(limit))
      .select('title handle price images');

    const total = await Product.countDocuments({
      collections: collection._id,
      status: 'active'
    });

    res.json({ 
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Collection products API error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Product recommendations
router.get('/products/:handle/recommendations', async (req, res) => {
  try {
    const product = await Product.findOne({ handle: req.params.handle });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get products from same collection
    let recommendations = [];
    if (product.collections && product.collections.length > 0) {
      recommendations = await Product.find({
        _id: { $ne: product._id },
        collections: { $in: product.collections },
        status: 'active'
      })
        .limit(4)
        .select('title handle price images');
    }

    // Fill with random products if needed
    if (recommendations.length < 4) {
      const moreProducts = await Product.find({
        _id: { $nin: [product._id, ...recommendations.map(p => p._id)] },
        status: 'active'
      })
        .limit(4 - recommendations.length)
        .select('title handle price images');
      recommendations = [...recommendations, ...moreProducts];
    }

    res.json({ recommendations });
  } catch (error) {
    console.error('Recommendations API error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;
