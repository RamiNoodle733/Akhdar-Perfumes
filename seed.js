/**
 * Database Seeder
 * Populates the database with sample products and collections
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Product = require('./src/models/Product');
const Collection = require('./src/models/Collection');
const Admin = require('./src/models/Admin');
const Page = require('./src/models/Page');

const products = [
  {
    title: 'Royal Oud Attar',
    handle: 'royal-oud-attar',
    description: 'A majestic blend of aged Cambodian oud with hints of rose and amber. This luxurious attar captures the essence of Arabian royalty, with deep woody notes that evolve into a warm, resinous dry-down.',
    price: 189.00,
    compareAtPrice: 220.00,
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800',
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800'
    ],
    olfactiveFamily: 'Oud',
    topNotes: ['Rose', 'Saffron'],
    middleNotes: ['Oud', 'Amber'],
    baseNotes: ['Sandalwood', 'Musk'],
    inventory: 25,
    status: 'active',
    tags: ['featured', 'best-seller', 'oud']
  },
  {
    title: 'Taif Rose Essence',
    handle: 'taif-rose-essence',
    description: 'Pure Taif rose distillate from the high mountains of Saudi Arabia. Known as the most precious rose in the world, this delicate yet intoxicating attar is the epitome of floral luxury.',
    price: 145.00,
    images: [
      'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=800'
    ],
    olfactiveFamily: 'Rose',
    topNotes: ['Rose Petals', 'Bergamot'],
    middleNotes: ['Taif Rose', 'Jasmine'],
    baseNotes: ['White Musk', 'Cedar'],
    inventory: 40,
    status: 'active',
    tags: ['featured', 'floral', 'rose']
  },
  {
    title: 'White Musk Premium',
    handle: 'white-musk-premium',
    description: 'A clean, ethereal interpretation of traditional Arabian musk. Soft, powdery, and utterly addictive, this alcohol-free attar lasts for days on the skin.',
    price: 85.00,
    images: [
      'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800'
    ],
    olfactiveFamily: 'Musk',
    topNotes: ['White Tea', 'Lily'],
    middleNotes: ['White Musk', 'Iris'],
    baseNotes: ['Sandalwood', 'Vanilla'],
    inventory: 60,
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
      'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800'
    ],
    olfactiveFamily: 'Amber',
    topNotes: ['Cardamom', 'Orange'],
    middleNotes: ['Amber', 'Benzoin'],
    baseNotes: ['Vanilla', 'Patchouli'],
    inventory: 35,
    status: 'active',
    tags: ['amber', 'warm']
  },
  {
    title: 'Sandalwood Mysore',
    handle: 'sandalwood-mysore',
    description: 'Authentic Mysore sandalwood, aged for over 20 years. Creamy, woody, and meditative - this is sandalwood at its purest and most sublime.',
    price: 210.00,
    images: [
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800'
    ],
    olfactiveFamily: 'Woody',
    topNotes: ['Saffron'],
    middleNotes: ['Sandalwood', 'Rose'],
    baseNotes: ['Mysore Sandalwood', 'Musk'],
    inventory: 15,
    status: 'active',
    tags: ['woody', 'sandalwood', 'premium']
  },
  {
    title: 'Jasmine Sambac',
    handle: 'jasmine-sambac',
    description: 'Heady, intoxicating jasmine sambac absolute blended with a touch of tuberose and ylang. An opulent white floral that captivates from the first drop.',
    price: 95.00,
    images: [
      'https://images.unsplash.com/photo-1566977776052-6e61e35bf9be?w=800'
    ],
    olfactiveFamily: 'Floral',
    topNotes: ['Green Notes', 'Neroli'],
    middleNotes: ['Jasmine Sambac', 'Tuberose'],
    baseNotes: ['Ylang Ylang', 'Musk'],
    inventory: 45,
    status: 'active',
    tags: ['floral', 'jasmine']
  },
  {
    title: 'Oriental Nights',
    handle: 'oriental-nights',
    description: 'A seductive blend inspired by Arabian nights - warm spices meet rich oud and sweet amber in this intoxicating evening fragrance.',
    price: 175.00,
    images: [
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800'
    ],
    olfactiveFamily: 'Oriental',
    topNotes: ['Cinnamon', 'Cardamom', 'Pink Pepper'],
    middleNotes: ['Oud', 'Rose', 'Incense'],
    baseNotes: ['Amber', 'Vanilla', 'Musk'],
    inventory: 30,
    status: 'active',
    tags: ['oriental', 'spicy', 'evening']
  },
  {
    title: 'Discovery Set - Classic',
    handle: 'discovery-set-classic',
    description: 'Experience our signature collection with this curated set of 5 sample vials. Perfect for exploring the world of authentic attars.',
    price: 65.00,
    images: [
      'https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?w=800'
    ],
    olfactiveFamily: 'Mixed',
    inventory: 100,
    status: 'active',
    tags: ['gift-set', 'discovery', 'new']
  }
];

const collections = [
  {
    title: 'All Products',
    handle: 'all',
    description: 'Browse our complete collection of authentic attars and perfume oils.',
    sortOrder: 0
  },
  {
    title: 'Oud Collection',
    handle: 'oud',
    description: 'Discover our selection of premium oud-based attars, sourced from the finest agarwood.',
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800',
    sortOrder: 1
  },
  {
    title: 'Rose Collection',
    handle: 'rose',
    description: 'Exquisite rose-based fragrances featuring the legendary Taif rose.',
    image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=800',
    sortOrder: 2
  },
  {
    title: 'Musk Collection',
    handle: 'musk',
    description: 'Clean, ethereal musk attars for everyday elegance.',
    image: 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800',
    sortOrder: 3
  },
  {
    title: 'Best Sellers',
    handle: 'best-sellers',
    description: 'Our most loved fragrances, trusted by customers worldwide.',
    sortOrder: 4
  },
  {
    title: 'Gift Sets',
    handle: 'gift-sets',
    description: 'Beautifully packaged sets perfect for gifting.',
    sortOrder: 5
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
    status: 'published'
  },
  {
    title: 'Our Story',
    handle: 'our-story',
    content: `
      <p>The story of Akhdar Perfumes begins in the bustling souks of the Middle East, where our founder first discovered his passion for traditional Arabian perfumery.</p>
      
      <p>Trained by master perfumers in the art of attar distillation, he spent years traveling to remote regions - from the oud forests of Southeast Asia to the rose gardens of Taif - to source the finest raw materials.</p>
      
      <p>Today, Akhdar Perfumes continues this legacy, bringing authentic Arabian fragrances to discerning customers around the world.</p>
    `,
    status: 'published'
  },
  {
    title: 'Contact Us',
    handle: 'contact',
    content: `
      <h2>Get in Touch</h2>
      <p>We'd love to hear from you. Whether you have questions about our products, need assistance with an order, or simply want to share your fragrance journey with us.</p>
      
      <h3>Email</h3>
      <p>support@akhdar-perfumes.com</p>
      
      <h3>Hours</h3>
      <p>Monday - Friday: 9am - 6pm EST</p>
      <p>Saturday: 10am - 4pm EST</p>
    `,
    status: 'published'
  },
  {
    title: 'Shipping & Returns',
    handle: 'shipping-returns',
    content: `
      <h2>Shipping</h2>
      <p>We offer worldwide shipping on all orders. Standard shipping typically takes 5-7 business days, while express shipping delivers in 2-3 business days.</p>
      
      <h3>Free Shipping</h3>
      <p>Enjoy free standard shipping on all orders over $100.</p>
      
      <h2>Returns</h2>
      <p>We want you to be completely satisfied with your purchase. If for any reason you're not happy, you may return unopened products within 30 days for a full refund.</p>
    `,
    status: 'published'
  }
];

async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/akhdar-perfumes');
    console.log('Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await Collection.deleteMany({});
    await Admin.deleteMany({});
    await Page.deleteMany({});
    console.log('Cleared existing data');

    // Create collections
    const createdCollections = await Collection.insertMany(collections);
    console.log(`Created ${createdCollections.length} collections`);

    // Create products with collection references
    const collectionMap = {};
    createdCollections.forEach(c => {
      collectionMap[c.handle] = c._id;
    });

    const productsWithCollections = products.map(product => {
      const productCollections = [collectionMap['all']]; // All products go in 'all' collection
      
      // Add to specific collections based on tags/family
      if (product.olfactiveFamily === 'Oud') productCollections.push(collectionMap['oud']);
      if (product.olfactiveFamily === 'Rose') productCollections.push(collectionMap['rose']);
      if (product.olfactiveFamily === 'Musk') productCollections.push(collectionMap['musk']);
      if (product.tags?.includes('best-seller')) productCollections.push(collectionMap['best-sellers']);
      if (product.tags?.includes('gift-set')) productCollections.push(collectionMap['gift-sets']);
      
      return {
        ...product,
        collections: productCollections.filter(Boolean)
      };
    });

    const createdProducts = await Product.insertMany(productsWithCollections);
    console.log(`Created ${createdProducts.length} products`);

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await Admin.create({
      name: 'Admin',
      email: 'admin@akhdar-perfumes.com',
      password: hashedPassword,
      role: 'admin'
    });
    console.log('Created admin user (email: admin@akhdar-perfumes.com, password: admin123)');

    // Create pages
    await Page.insertMany(pages);
    console.log(`Created ${pages.length} pages`);

    console.log('\n✅ Database seeded successfully!');
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
