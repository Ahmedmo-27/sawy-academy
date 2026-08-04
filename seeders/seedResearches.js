const Research = require("../models/Research");
const researches = require("./data/researches");

async function seedResearches() {
  await Research.deleteMany({});
  const docs = await Research.insertMany(researches);
  console.log(`  Research: ${docs.length} documents`);
  return docs;
}

module.exports = seedResearches;
