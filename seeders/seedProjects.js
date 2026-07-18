const Project = require("../models/Project");
const projects = require("./data/projects");

async function seedProjects() {
  await Project.deleteMany({});
  const docs = await Project.insertMany(projects);
  console.log(`  Project: ${docs.length} documents`);
  return docs;
}

module.exports = seedProjects;
