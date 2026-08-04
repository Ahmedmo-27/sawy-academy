const Course = require("../models/Course");
const CourseGroup = require("../models/CourseGroup");
const Lesson = require("../models/Lesson");
const Product = require("../models/Product");
const courseGroups = require("./data/courseGroups");

async function seedCourses() {
  await CourseGroup.deleteMany({});
  await Course.deleteMany({});
  await Lesson.deleteMany({});

  const products = await Product.find({}).lean();
  const productByFrontendId = new Map(products.map((product) => [product.id, product._id]));

  const createdGroups = [];

  for (const group of courseGroups) {
    const courseObjectIds = [];

    for (const course of group.courses) {
      const lessonDocs = await Lesson.insertMany(course.lessons);
      const relatedProductIds = course.relatedProductIds.map((frontendId) => {
        const objectId = productByFrontendId.get(frontendId);
        if (!objectId) {
          throw new Error(
            `Product id "${frontendId}" referenced by course "${course.slug}" was not found. Seed products first.`
          );
        }
        return objectId;
      });

      const courseDoc = await Course.create({
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description,
        level: course.level,
        instructor: course.instructor,
        price: course.price,
        lessons: lessonDocs.map((lesson) => lesson._id),
        relatedProductIds,
      });

      courseObjectIds.push(courseDoc._id);
    }

    const groupDoc = await CourseGroup.create({
      title: group.title,
      subtitle: group.subtitle,
      type: group.type,
      courses: courseObjectIds,
      bundlePrice: group.bundlePrice,
    });

    createdGroups.push(groupDoc);
  }

  const courseCount = await Course.countDocuments();
  const lessonCount = await Lesson.countDocuments();

  console.log(`  Lesson: ${lessonCount} documents`);
  console.log(`  Course: ${courseCount} documents`);
  console.log(`  CourseGroup: ${createdGroups.length} documents`);

  return createdGroups;
}

module.exports = seedCourses;
