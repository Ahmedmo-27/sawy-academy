const Product = require("../models/Product");
const products = require("./data/products");

async function seedProducts() {
  await Product.deleteMany({});
  const docs = await Product.insertMany(products);
  console.log(`  Product: ${docs.length} documents`);
  return docs;
}

module.exports = seedProducts;
