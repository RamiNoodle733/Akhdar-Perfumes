import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Collection title is required'],
    trim: true
  },
  handle: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String
  },
  image: {
    url: { type: String },
    alt: { type: String }
  },
  
  // SEO
  seo: {
    title: { type: String },
    description: { type: String }
  },
  
  // Sorting
  sortOrder: {
    type: String,
    enum: ['manual', 'best-selling', 'title-asc', 'title-desc', 'price-asc', 'price-desc', 'created-desc', 'created-asc'],
    default: 'manual'
  },
  
  // Display settings
  productsPerRow: {
    type: Number,
    default: 4
  },
  
  // Status
  published: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create handle from title before saving
collectionSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.handle) {
    this.handle = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Index
collectionSchema.index({ handle: 1 });
collectionSchema.index({ published: 1 });

const Collection = mongoose.model('Collection', collectionSchema);

export default Collection;
