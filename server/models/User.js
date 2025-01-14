const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  avatar: { 
    type: String, 
    default: '' 
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other'
  },
  bio: {
    type: String,
    default: ''
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  wallet: {
    balance: {
      type: Number,
      default: 0,
      get: v => Number(v.toFixed(2)),
      set: v => Number(v.toFixed(2))
    },
    rechargeRequests: [{
      amount: {
        type: Number,
        get: v => Number(v.toFixed(2)),
        set: v => Number(v.toFixed(2))
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      createTime: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  toJSON: { getters: true },
  toObject: { getters: true }
});

module.exports = mongoose.model('User', userSchema);