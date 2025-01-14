const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 30
  },
  content: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['books', 'food', 'home', 'fashion', 'travel', 'other']
  },
  coverUrl: {
    type: String,
    default: '/images/default-post-cover.svg'
  },
  images: [{
    type: String
  }],
  collections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    createTime: {
      type: Date,
      default: Date.now
    }
  }],
  createTime: {
    type: Date,
    default: Date.now
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['normal', 'blocked'],
    default: 'normal'
  }
});

postSchema.virtual('likesCount').get(function() {
  return this.likes?.length || 0;
});

postSchema.virtual('collectionsCount').get(function() {
  return this.collections?.length || 0;
});

postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);