import express from 'express';
import Page from '../models/Page.js';

const router = express.Router();

// Dynamic page route
router.get('/:handle', async (req, res) => {
  try {
    const page = await Page.findOne({ 
      handle: req.params.handle,
      published: true
    });

    if (!page) {
      return res.status(404).render('pages/404', {
        title: 'Page Not Found - Akhdar Perfumes'
      });
    }

    res.render('pages/page', {
      title: `${page.title} - Akhdar Perfumes`,
      page,
      seo: {
        title: page.seo?.title || page.title,
        description: page.seo?.description
      }
    });
  } catch (error) {
    console.error('Page error:', error);
    res.status(500).render('pages/error', {
      title: 'Error',
      error: 'Failed to load page'
    });
  }
});

export default router;
