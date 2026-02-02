import express from 'express';
import Collection from '../models/Collection.js';
import Product from '../models/Product.js';

const router = express.Router();

// All collections
router.get('/', async (req, res) => {
  try {
    const collections = await Collection.find({ published: true });
    
    // Get product count for each collection
    const collectionsWithCount = await Promise.all(
      collections.map(async (collection) => {
        const productCount = await Product.countDocuments({
          collections: collection._id,
          status: 'active'
        });
        return {
          ...collection.toObject(),
          productCount
        };
      })
    );

    res.render('pages/collections', {
      title: 'Collections - Akhdar Perfumes',
      collections: collectionsWithCount
    });
  } catch (error) {
    console.error('Collections page error:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      error: 'Failed to load collections'
    });
  }
});

// Single collection page
router.get('/:handle', async (req, res) => {
  try {
    const { sort = 'manual', page = 1 } = req.query;
    const limit = 12;
    const skip = (page - 1) * limit;

    const collection = await Collection.findOne({ 
      handle: req.params.handle,
      published: true
    });

    if (!collection) {
      return res.status(404).render('pages/404', {
        title: 'Collection Not Found - Akhdar Perfumes'
      });
    }

    let sortOption = {};
    const sortBy = sort || collection.sortOrder;
    switch (sortBy) {
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
      case 'created-asc':
        sortOption = { createdAt: 1 };
        break;
      case 'created-desc':
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const products = await Product.find({
      collections: collection._id,
      status: 'active'
    })
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments({
      collections: collection._id,
      status: 'active'
    });
    const totalPages = Math.ceil(total / limit);

    res.render('pages/collection', {
      title: `${collection.title} - Akhdar Perfumes`,
      collection,
      products,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      sort: sortBy,
      productCount: total
    });
  } catch (error) {
    console.error('Collection page error:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      error: 'Failed to load collection'
    });
  }
});

export default router;
