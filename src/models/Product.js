import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  compareAtPrice: { type: Number },
  sku: { type: String },
  inventory: { type: Number, default: 0 },
  weight: { type: Number }, // in grams
  image: { type: String }
});

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Product title is required'],
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
    type: String,
    required: [true, 'Product description is required']
  },
  shortDescription: {
    type: String
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: 0
  },
  compareAtPrice: {
    type: Number,
    min: 0
  },
  images: [{
    url: { type: String, required: true },
    alt: { type: String },
    position: { type: Number, default: 0 }
  }],
  variants: [variantSchema],
  options: [{
    name: { type: String },
    values: [{ type: String }]
  }],
  collections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
  }],
  tags: [{ type: String }],
  vendor: { type: String, default: 'Akhdar Perfumes' },
  productType: { type: String, default: 'Perfume Oil' },
  
  // Fragrance-specific fields
  fragrance: {
    olfactiveFamily: { type: String },
    topNotes: [{ type: String }],
    middleNotes: [{ type: String }],
    baseNotes: [{ type: String }],
    concentration: { type: String },
    longevity: { type: String },
    sillage: { type: String }
  },
  
  // 3D Model for AR/VR
  model3d: {
    glbUrl: { type: String },
    usdzUrl: { type: String },
    posterImage: { type: String }
  },
  
  // SEO
  seo: {
    title: { type: String },
    description: { type: String }
  },
  
  // Inventory
  inventory: {
    quantity: { type: Number, default: 0 },
    trackInventory: { type: Boolean, default: true },
    allowBackorder: { type: Boolean, default: false }
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'draft', 'archived'],
    default: 'active'
  },
  featured: { type: Boolean, default: false },
  
  // Timestamps
  publishedAt: { type: Date }
}, {
  timestamps: true
});

// Create handle from title before saving
productSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.handle) {
    this.handle = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Virtual for checking if on sale
productSchema.virtual('onSale').get(function() {
  return this.compareAtPrice && this.compareAtPrice > this.price;
});

// Virtual for discount percentage
productSchema.virtual('discountPercent').get(function() {
  if (this.onSale) {
    return Math.round((1 - this.price / this.compareAtPrice) * 100);
  }
  return 0;
});

// Virtual for availability
productSchema.virtual('available').get(function() {
  if (!this.inventory.trackInventory) return true;
  if (this.inventory.allowBackorder) return true;
  return this.inventory.quantity > 0;
});

// Virtual for featured image
productSchema.virtual('featuredImage').get(function() {
  if (this.images && this.images.length > 0) {
    const sorted = [...this.images].sort((a, b) => a.position - b.position);
    return sorted[0];
  }
  return null;
});

// Index for search
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ handle: 1 });
productSchema.index({ status: 1, featured: 1 });

// Enable virtuals in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);

export default Product;
