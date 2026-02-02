import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  title: { type: String, required: true },
  variant: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String }
});

const addressSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  company: { type: String },
  address1: { type: String, required: true },
  address2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  country: { type: String, required: true, default: 'US' },
  phone: { type: String }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Email is required']
  },
  items: [orderItemSchema],
  
  // Addresses
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  sameAsBilling: { type: Boolean, default: true },
  
  // Pricing
  subtotal: { type: Number, required: true },
  shipping: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  
  // Discount code
  discountCode: { type: String },
  
  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  paymentMethod: { type: String },
  stripePaymentIntentId: { type: String },
  
  // Fulfillment
  fulfillmentStatus: {
    type: String,
    enum: ['unfulfilled', 'partial', 'fulfilled', 'cancelled'],
    default: 'unfulfilled'
  },
  trackingNumber: { type: String },
  trackingUrl: { type: String },
  shippingMethod: { type: String },
  
  // Notes
  customerNote: { type: String },
  internalNote: { type: String },
  
  // Customer (optional - for guest checkout)
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  }
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `AKH-${String(count + 1001).padStart(5, '0')}`;
  }
  next();
});

// Index
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ email: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1, fulfillmentStatus: 1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
