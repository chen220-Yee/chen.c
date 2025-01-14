const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    get: function(val) {
      return val || this.goodsName || '';
    }
  },
  goodsName: {
    type: String
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  description: {
    type: String,
    required: true,
    get: function(val) {
      return val || this.goodsContent || '';
    }
  },
  goodsContent: {
    type: String
  },
  picture: {
    type: String,
    default: '/default-product.png'
  },
  category: {
    type: String,
    required: true,
    enum: ['服装', '食品', '电器', '家具', '百货', '其它']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { getters: true, virtuals: true },
  toObject: { getters: true, virtuals: true }
});

productSchema.pre('save', function(next) {
  if (this.isModified('goodsName') && !this.name) {
    this.name = this.goodsName;
  }
  if (this.isModified('goodsContent') && !this.description) {
    this.description = this.goodsContent;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema); 