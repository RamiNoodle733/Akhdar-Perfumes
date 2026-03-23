/**
 * Database Seeder
 * Populates the database with sample products and collections
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import Product from './src/models/Product.js';
import Collection from './src/models/Collection.js';
import Admin from './src/models/Admin.js';
import Page from './src/models/Page.js';

dotenv.config();

const products = [
  {
    title: 'Royal Oud Attar',
    handle: 'royal-oud-attar',
    description: 'A majestic blend of aged Cambodian oud with hints of rose and amber. This luxurious attar captures the essence of Arabian royalty, with deep woody notes that evolve into a warm, resinous dry-down.',
    price: 189.00,
    compareAtPrice: 220.00,
    images: [
      { url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800', alt: 'Royal Oud Attar', position: 0 },
      { url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800', alt: 'Royal Oud Attar 2', position: 1 }
    ],
    fragrance: {
      olfactiveFamily: 'Oud',
      topNotes: ['Rose', 'Saffron'],
      middleNotes: ['Oud', 'Amber'],
      baseNotes: ['Sandalwood', 'Musk']
    },
    inventory: { quantity: 25, trackInventory: true },
    status: 'active',
    featured: true,
    tags: ['featured', 'best-seller', 'oud']
  },
  {
    title: 'Taif Rose Essence',
    handle: 'taif-rose-essence',
    description: 'Pure Taif rose distillate from the high mountains of Saudi Arabia. Known as the most precious rose in the world, this delicate yet intoxicating attar is the epitome of floral luxury.',
    price: 145.00,
    images: [
      { url: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=800', alt: 'Taif Rose Essence', position: 0 }
    ],
    fragrance: {
      olfactiveFamily: 'Rose',
      topNotes: ['Rose Petals', 'Bergamot'],
      middleNotes: ['Taif Rose', 'Jasmine'],
      baseNotes: ['White Musk', 'Cedar']
    },
    inventory: { quantity: 40, trackInventory: true },
    status: 'active',
    featured: true,
    tags: ['featured', 'floral', 'rose']
  },
  {
    title: 'White Musk Premium',
    handle: 'white-musk-premium',
    description: 'A clean, ethereal interpretation of traditional Arabian musk. Soft, powdery, and utterly addictive, this alcohol-free attar lasts for days on the skin.',
    price: 85.00,
    images: [
      { url: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800', alt: 'White Musk Premium', position: 0 }
    ],
    fragrance: {
      olfactiveFamily: 'Musk',
      topNotes: ['White Tea', 'Lily'],
      middleNotes: ['White Musk', 'Iris'],
      baseNotes: ['Sandalwood', 'Vanilla']
    },
    inventory: { quantity: 60, trackInventory: true },
    status: 'active',
    tags: ['musk', 'clean']
  },
  {
    title: 'Amber Gold',
    handle: 'amber-gold',
    description: 'Warm, opulent amber combined with precious woods and a touch of vanilla. A comforting yet sophisticated fragrance perfect for cool evenings.',
    price: 120.00,
    compareAtPrice: 150.00,
    images: [
      { url: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800', alt: 'Amber Gold', position: 0 }
    ],
    fragrance: {
      olfactiveFamily: 'Amber',
      topNotes: ['Cardamom', 'Orange'],
      middleNotes: ['Amber', 'Benzoin'],
      baseNotes: ['Vanilla', 'Patchouli']
    },
    inventory: { quantity: 35, trackInventory: true },
    status: 'active',
    tags: ['amber', 'warm']
  },
  {
    title: 'Sandalwood Mysore',
    handle: 'sandalwood-mysore',
    description: 'Authentic Mysore sandalwood, aged for over 20 years. Creamy, woody, and meditative - this is sandalwood at its purest and most sublime.',
    price: 210.00,
    images: [
      { url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800', alt: 'Sandalwood Mysore', position: 0 }
    ],
    fragrance: {
      olfactiveFamily: 'Woody',
      topNotes: ['Saffron'],
      middleNotes: ['Sandalwood', 'Rose'],
      baseNotes: ['Mysore Sandalwood', 'Musk']
    },
    inventory: { quantity: 15, trackInventory: true },
    status: 'active',
    tags: ['woody', 'sandalwood', 'premium']
  },
  {
    title: 'Jasmine Sambac',
    handle: 'jasmine-sambac',
    description: 'Heady, intoxicating jasmine sambac absolute blended with a touch of tuberose and ylang. An opulent white floral that captivates from the first drop.',
    price: 95.00,
    images: [
      { url: 'https://images.unsplash.com/photo-1566977776052-6e61e35bf9be?w=800', alt: 'Jasmine Sambac', position: 0 }
    ],
    fragrance: {
      olfactiveFamily: 'Floral',
      topNotes: ['Green Notes', 'Neroli'],
      middleNotes: ['Jasmine Sambac', 'Tuberose'],
      baseNotes: ['Ylang Ylang', 'Musk']
    },
    inventory: { quantity: 45, trackInventory: true },
    status: 'active',
    tags: ['floral', 'jasmine']
  },
  {
    title: 'Oriental Nights',
    handle: 'oriental-nights',
    description: 'A seductive blend inspired by Arabian nights - warm spices meet rich oud and sweet amber in this intoxicating evening fragrance.',
    price: 175.00,
    images: [
      { url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800', alt: 'Oriental Nights', position: 0 }
    ],
    fragrance: {
      olfactiveFamily: 'Oriental',
      topNotes: ['Cinnamon', 'Cardamom', 'Pink Pepper'],
      middleNotes: ['Oud', 'Rose', 'Incense'],
      baseNotes: ['Amber', 'Vanilla', 'Musk']
    },
    inventory: { quantity: 30, trackInventory: true },
    status: 'active',
    tags: ['oriental', 'spicy', 'evening']
  },
  {
    title: 'Discovery Set - Classic',
    handle: 'discovery-set-classic',
    description: 'Experience our signature collection with this curated set of 5 sample vials. Perfect for exploring the world of authentic attars.',
    price: 65.00,
    images: [
      { url: 'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=800', alt: 'Discovery Set', position: 0 }
    ],
    fragrance: {
      olfactiveFamily: 'Mixed'
    },
    inventory: { quantity: 100, trackInventory: true },
    status: 'active',
    tags: ['gift-set', 'discovery', 'new']
  }
];

const collections = [
  {
    title: 'All Products',
    handle: 'all',
    description: 'Browse our complete collection of authentic attars and perfume oils.',
    sortOrder: 'created-desc'
  },
  {
    title: 'Oud Collection',
    handle: 'oud',
    description: 'Discover our selection of premium oud-based attars, sourced from the finest agarwood.',
    sortOrder: 'manual'
  },
  {
    title: 'Rose Collection',
    handle: 'rose',
    description: 'Exquisite rose-based fragrances featuring the legendary Taif rose.',
    sortOrder: 'manual'
  },
  {
    title: 'Musk Collection',
    handle: 'musk',
    description: 'Clean, ethereal musk attars for everyday elegance.',
    sortOrder: 'manual'
  },
  {
    title: 'Best Sellers',
    handle: 'best-sellers',
    description: 'Our most loved fragrances, trusted by customers worldwide.',
    sortOrder: 'manual'
  },
  {
    title: 'Gift Sets',
    handle: 'gift-sets',
    description: 'Beautifully packaged sets perfect for gifting.',
    sortOrder: 'manual'
  }
];

const pages = [
  {
    title: 'About Us',
    handle: 'about',
    content: `
      <h2>Our Heritage</h2>
      <p>Akhdar Perfumes was founded on a passion for preserving the ancient art of Arabian perfumery. For generations, our family has been dedicated to sourcing the finest natural ingredients and crafting exquisite attars using time-honored techniques.</p>
      <h2>Our Philosophy</h2>
      <p>We believe that true luxury lies in authenticity. Every fragrance we create uses only the purest natural oils, aged to perfection and blended with the utmost care. Our attars contain no alcohol or synthetic additives - just pure, concentrated essence.</p>
      <h2>Our Promise</h2>
      <p>When you choose Akhdar Perfumes, you're not just buying a fragrance - you're investing in a piece of olfactory art that connects you to centuries of perfumery tradition.</p>
    `,
    published: true
  },
  {
    title: 'Our Story',
    handle: 'our-story',
    content: `
      <p>The story of Akhdar Perfumes begins in the bustling souks of the Middle East, where our founder first discovered his passion for traditional Arabian perfumery.</p>
      <p>Trained by master perfumers in the art of attar distillation, he spent years traveling to remote regions - from the oud forests of Southeast Asia to the rose gardens of Taif - to source the finest raw materials.</p>
      <p>Today, Akhdar Perfumes continues this legacy, bringing authentic Arabian fragrances to discerning customers around the world.</p>
    `,
    published: true
  },
  {
    title: 'Shipping & Returns',
    handle: 'shipping-returns',
    content: `
      <h2>Shipping</h2>
      <p>We offer worldwide shipping on all orders. Standard shipping typically takes 5-7 business days, while express shipping delivers in 2-3 business days.</p>
      <h3>Free Shipping</h3>
      <p>Enjoy free standard shipping on all orders over $75.</p>
      <h2>Returns</h2>
      <p>We want you to be completely satisfied with your purchase. If for any reason you're not happy, you may return unopened products within 30 days for a full refund.</p>
      <h3>How to Return</h3>
      <p>Contact our support team at support@akhdar-perfumes.com to initiate a return. We'll provide you with a return shipping label and process your refund within 5-7 business days of receiving the returned item.</p>
    `,
    published: true
  },
  {
    title: 'Privacy Policy',
    handle: 'privacy-policy',
    content: `
      <h2>Privacy Policy</h2>
      <p>At Akhdar Perfumes, we are committed to protecting your privacy. This policy outlines how we collect, use, and safeguard your personal information.</p>
      <h3>Information We Collect</h3>
      <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us. This includes your name, email address, shipping address, and payment information.</p>
      <h3>How We Use Your Information</h3>
      <p>We use your information to process orders, communicate with you about your purchases, and improve our services. We do not sell your personal information to third parties.</p>
      <h3>Data Security</h3>
      <p>We implement industry-standard security measures to protect your data. Payment processing is handled securely through Stripe.</p>
    `,
    published: true
  },
  {
    title: 'Terms of Service',
    handle: 'terms-of-service',
    content: `
      <h2>Terms of Service</h2>
      <p>By using our website and services, you agree to these terms of service.</p>
      <h3>Orders & Payment</h3>
      <p>All prices are listed in USD. We accept major credit cards through our secure payment processor, Stripe. Orders are subject to availability.</p>
      <h3>Shipping</h3>
      <p>We ship to most countries worldwide. Delivery times vary by location and shipping method selected at checkout.</p>
      <h3>Contact</h3>
      <p>For questions about these terms, please contact us at support@akhdar-perfumes.com.</p>
    `,
    published: true
  },
  {
    title: 'Refund Policy',
    handle: 'refund-policy',
    content: `
      <h2>Refund Policy</h2>
      <p>We want you to be completely satisfied with your purchase from Akhdar Perfumes.</p>
      <h3>30-Day Return Window</h3>
      <p>You may return any unopened product within 30 days of delivery for a full refund. Items must be in their original packaging.</p>
      <h3>Damaged or Defective Items</h3>
      <p>If you receive a damaged or defective item, please contact us immediately. We will arrange a replacement or full refund at no additional cost.</p>
      <h3>Processing Refunds</h3>
      <p>Refunds are processed within 5-7 business days after we receive your return. The refund will be applied to your original payment method.</p>
    `,
    published: true
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/akhdar-perfumes');
    console.log('Connected to MongoDB');

    await Product.deleteMany({});
    await Collection.deleteMany({});
    await Admin.deleteMany({});
    await Page.deleteMany({});
    console.log('Cleared existing data');

    const createdCollections = await Collection.insertMany(collections);
    console.log(`Created ${createdCollections.length} collections`);

    const collectionMap = {};
    createdCollections.forEach(c => {
      collectionMap[c.handle] = c._id;
    });

    const productsWithCollections = products.map(product => {
      const productCollections = [collectionMap['all']];
      
      const family = product.fragrance?.olfactiveFamily;
      if (family === 'Oud') productCollections.push(collectionMap['oud']);
      if (family === 'Rose') productCollections.push(collectionMap['rose']);
      if (family === 'Musk') productCollections.push(collectionMap['musk']);
      if (product.tags?.includes('best-seller')) productCollections.push(collectionMap['best-sellers']);
      if (product.tags?.includes('gift-set')) productCollections.push(collectionMap['gift-sets']);
      
      return {
        ...product,
        collections: productCollections.filter(Boolean)
      };
    });

    const createdProducts = await Product.insertMany(productsWithCollections);
    console.log(`Created ${createdProducts.length} products`);

    await Admin.create({
      name: 'Admin',
      email: 'admin@akhdar-perfumes.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Created admin user (email: admin@akhdar-perfumes.com, password: admin123)');

    await Page.insertMany(pages);
    console.log(`Created ${pages.length} pages`);

    console.log('\nDatabase seeded successfully!');
    console.log('\nAdmin Login:');
    console.log('  Email: admin@akhdar-perfumes.com');
    console.log('  Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
