import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Page title is required'],
    trim: true
  },
  handle: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  template: {
    type: String,
    default: 'default'
  },
  
  // SEO
  seo: {
    title: { type: String },
    description: { type: String }
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
pageSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.handle) {
    this.handle = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

pageSchema.index({ handle: 1 });

const Page = mongoose.model('Page', pageSchema);

export default Page;
