import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// All products
router.get('/', async (req, res) => {
  try {
    const { sort = 'newest', page = 1 } = req.query;
    const limit = 12;
    const skip = (page - 1) * limit;

    let sortOption = {};
    switch (sort) {
      case 'price-asc':
        sortOption = { price: 1 };
        break;
      case 'price-desc':
        sortOption = { price: -1 };
        break;
      case 'title-asc':
        sortOption = { title: 1 };
        break;
      case 'title-desc':
        sortOption = { title: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const products = await Product.find({ status: 'active' })
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('collections');

    const total = await Product.countDocuments({ status: 'active' });
    const totalPages = Math.ceil(total / limit);

    res.render('pages/products', {
      title: 'All Products - Akhdar Perfumes',
      products,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      sort
    });
  } catch (error) {
    console.error('Products page error:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      error: 'Failed to load products'
    });
  }
});

// Single product page
router.get('/:handle', async (req, res) => {
  try {
    const product = await Product.findOne({ 
      handle: req.params.handle,
      status: 'active'
    }).populate('collections');

    if (!product) {
      return res.status(404).render('pages/404', {
        title: 'Product Not Found - Akhdar Perfumes'
      });
    }

    // Get related products from same collection
    let relatedProducts = [];
    if (product.collections && product.collections.length > 0) {
      relatedProducts = await Product.find({
        _id: { $ne: product._id },
        collections: { $in: product.collections.map(c => c._id) },
        status: 'active'
      }).limit(4);
    }

    // If not enough related products, get random ones
    if (relatedProducts.length < 4) {
      const moreProducts = await Product.find({
        _id: { $nin: [product._id, ...relatedProducts.map(p => p._id)] },
        status: 'active'
      }).limit(4 - relatedProducts.length);
      relatedProducts = [...relatedProducts, ...moreProducts];
    }

    res.render('pages/product', {
      title: `${product.title} - Akhdar Perfumes`,
      product,
      relatedProducts,
      seo: {
        title: product.seo?.title || product.title,
        description: product.seo?.description || product.shortDescription || product.description?.substring(0, 160)
      }
    });
  } catch (error) {
    console.error('Product page error:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      error: 'Failed to load product'
    });
  }
});

export default router;
