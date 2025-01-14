const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

async function migrateProducts() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to MongoDB');

    // 获取所有商品
    const products = await Product.find({});
    console.log(`Found ${products.length} products to migrate`);
    
    // 更新每个商品
    for (const product of products) {
      // 如果存在旧字段名，则更新为新字段名
      const updates = {};
      
      if (product.goodsName && !product.name) {
        updates.name = product.goodsName;
        console.log(`Migrating name for product ${product._id}`);
      }
      
      if (product.goodsContent && !product.description) {
        updates.description = product.goodsContent;
      }
      
      if (Object.keys(updates).length > 0) {
        await Product.findByIdAndUpdate(product._id, updates);
        console.log(`Updated product ${product._id}`);
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrateProducts(); 