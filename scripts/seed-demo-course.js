/**
 * Seed Demo Course with Real Video, PDF, and Public Assets
 * Course: Parametric Form & Algorithmic Design
 * Slug: parametric-form-algorithmic-design
 */

require("dotenv").config();

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const mongoose = require("mongoose");
const { Upload } = require("@aws-sdk/lib-storage");

const Course = require("../models/Course");
const CourseGroup = require("../models/CourseGroup");
const Lesson = require("../models/Lesson");
const VideoAsset = require("../models/VideoAsset");
const DocumentAsset = require("../models/DocumentAsset");
const VideoProcessingJob = require("../models/VideoProcessingJob");
const Enrollment = require("../models/Enrollment");
const Product = require("../models/Product");
const User = require("../models/User");

const {
  getPrivateR2Config,
  getPublicR2Config,
  getR2Client,
  isPrivateR2Configured,
  isPublicR2Configured,
} = require("../lib/r2Config");
const { putPublicWebsiteAsset } = require("../lib/publicR2Storage");
const { putPrivateObject } = require("../lib/privateR2Storage");
const { buildLessonDocKey } = require("../lib/r2ObjectKeys");
const {
  buildVideoAssetOutputPrefix,
  buildVideoAssetSourceKey,
} = require("../lib/videoAccess");
const { generateWrappedContentKey } = require("../lib/videoEncryption");
const { getVideoProcessingConfig } = require("../lib/videoProcessingConfig");
const { handleClaimedJob } = require("../workers/videoProcessingWorker");

const DEMO_COURSE_SLUG = "parametric-form-algorithmic-design";
const INSTRUCTOR_NAME = "Prof. Mohamed El Sawy";

function generateVideo({ destination, pattern = "testsrc", freq = 440, duration = 3 }) {
  const ffmpeg = getVideoProcessingConfig().ffmpegPath;
  const result = spawnSync(
    ffmpeg,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      `${pattern}=duration=${duration}:size=640x360:rate=24`,
      "-f",
      "lavfi",
      "-i",
      `sine=frequency=${freq}:duration=${duration}`,
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-shortest",
      "-y",
      destination,
    ],
    { encoding: "utf8" }
  );

  if (result.error || result.status !== 0) {
    throw new Error(
      `FFmpeg failed to generate demo video: ${result.stderr || result.error?.message}`
    );
  }
}

function generatePdfBuffer({ sheetNumber, title, subtitle }) {
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 280 >>
stream
BT
/F1 20 Tf
50 540 Td
(SAWY ACADEMY · ARCHITECTURAL DRAWING SET) Tj
/F1 14 Tf
0 -35 Td
(SHEET REF: ${sheetNumber} · ${title}) Tj
/F1 10 Tf
0 -25 Td
(${subtitle}) Tj
0 -30 Td
(Instructor: ${INSTRUCTOR_NAME} · Scale: 1:50 · Drawing Convention: Metric) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000244 00000 n
0000000576 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
658
%%EOF
`;
  return Buffer.from(pdfString, "utf8");
}

function generateCoverImageBuffer() {
  // A solid 1x1 PNG or standard PNG buffer for the public cover
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAlgAAAGQCAYAAAByNR6YAAAABHNCSVQICAgIfAhkiAAAAGZJREFUeJztwTEBAAAAwqD1T20ND6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4GwN5QAB538/7QAAAABJRU5ErkJggg==",
    "base64"
  );
}

async function main() {
  console.log("===============================================================");
  console.log("     CREATING FULL DEMO COURSE WITH VIDEOS & DOCUMENTS         ");
  console.log("===============================================================\n");

  if (!isPrivateR2Configured() || !isPublicR2Configured()) {
    console.error("ERROR: R2 buckets must be configured.");
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("ERROR: MONGODB_URI is required.");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("[OK] Connected to MongoDB Atlas");

  const privateConfig = getPrivateR2Config();
  const publicConfig = getPublicR2Config();
  const r2Client = getR2Client();

  // Find related products (e.g. Rhino 8, Rotring, Thinking Architecture)
  const products = await Product.find({}).lean();
  const productIds = products
    .filter((p) => ["p1", "p2", "p3"].includes(p.id))
    .map((p) => p._id);

  // Clean up any existing demo course with this slug
  const existingCourse = await Course.findOne({ slug: DEMO_COURSE_SLUG });
  if (existingCourse) {
    console.log(`Cleaning up previously seeded demo course "${DEMO_COURSE_SLUG}"...`);
    const oldLessons = await Lesson.find({ _id: { $in: existingCourse.lessons } });
    const oldLessonIds = oldLessons.map((l) => l._id);

    await Promise.all([
      CourseGroup.deleteMany({ courses: existingCourse._id }),
      Enrollment.deleteMany({ courseId: existingCourse._id }),
      VideoProcessingJob.deleteMany({ lessonId: { $in: oldLessonIds } }),
      VideoAsset.deleteMany({ lessonId: { $in: oldLessonIds } }),
      DocumentAsset.deleteMany({ lessonId: { $in: oldLessonIds } }),
      Lesson.deleteMany({ _id: { $in: oldLessonIds } }),
      Course.deleteOne({ _id: existingCourse._id }),
    ]);
  }

  // 1. Upload Public Course Cover Asset
  console.log("Uploading course cover image to Public R2...");
  const coverUpload = await putPublicWebsiteAsset({
    page: "courses",
    entityId: DEMO_COURSE_SLUG,
    filename: "parametric-architecture-masterclass-cover.png",
    contentType: "image/png",
    body: generateCoverImageBuffer(),
  });
  console.log(`[OK] Cover uploaded -> ${coverUpload.url}`);

  // 2. Define Lesson Specifications
  const lessonSpecs = [
    {
      id: "pf-01",
      slug: "computational-proportions-modular-grids",
      title: "01: Computational Proportions & Modular Grids",
      sheetRef: "PF-01",
      duration: "45 min",
      summary:
        "Algorithmic subdivision systems, parametric coordinate spaces, and proportional hierarchies for complex architectural floorplates.",
      content: `Proportion in algorithmic architecture is neither arbitrary nor static. It represents a continuous mathematical mapping between geometric constraints, boundary curves, and structural bay divisions.

In this foundational masterclass lesson, we explore how parametric arrays and recursive subdivisions establish order across irregular site boundaries. We construct adaptive coordinate frames that scale proportionally without distortion.

Key Topics:
• Establishing parametric coordinate fields and domain mapping
• Recursive Voronoi and Delaunay subdivisions for load-bearing floorplates
• Modular tolerance rules: reconciling digital precision with physical material dimensions

Assignment Exercise:
Construct a 3D parametric floorplate subdivided into three functional zones using a responsive 8-unit proportional module. Annotate all transition nodes and structural column alignments on your drawing sheet.`,
      videoPattern: "testsrc",
      videoFreq: 440,
      pdfTitle: "Computational Proportions & Modular Grids",
      pdfSubtitle: "Parametric Coordinate Field & Geometric Subdivision Guidelines",
    },
    {
      id: "pf-02",
      slug: "solar-envelope-responsive-facades",
      title: "02: Solar Envelopes & Responsive Kinetic Facades",
      sheetRef: "PF-02",
      duration: "55 min",
      summary:
        "Designing responsive kinetic shading systems driven by solar vector calculus, radiation analysis, and environmental daylight autonomy curves.",
      content: `A building skin is an active thermodynamic filter. Rather than uniform ornamentation, responsive architectural facades modulate aperture sizes based on real-time solar exposure and incident radiation angles.

In this lesson, we formulate mathematical vector equations to compute sun position vectors relative to surface normal vectors across curved building envelopes.

Key Topics:
• Solar vector calculations and incident angle dot-product evaluation
• Kinetic louver kinematics: rotational vs. folding parametric mechanisms
• Daylight Autonomy (DA) and Useful Daylight Illuminance (UDI) optimization workflows

Assignment Exercise:
Model a double-curved responsive facade segment containing at least 24 kinetic panel units. Program the panel rotation angle to respond continuously to a simulated summer solstice sun path. Export elevation and detailed section drawings to PDF.`,
      videoPattern: "smptebars",
      videoFreq: 520,
      pdfTitle: "Solar Envelopes & Responsive Kinetic Facades",
      pdfSubtitle: "Kinetic Louver Kinematics & Solar Radiation Vector Analysis",
    },
    {
      id: "pf-03",
      slug: "digital-fabrication-material-tectonics",
      title: "03: Digital Fabrication & CNC Material Tectonics",
      sheetRef: "PF-03",
      duration: "60 min",
      summary:
        "Translating complex double-curved surfaces into CNC-milled structural ribs, planar unrolled panels, and friction-fit timber joinery.",
      content: `The ultimate test of computational design is physical constructability. Pure digital curvature must be translated into material sheets, toolpaths, and structural joints that can be manufactured within strict tolerances.

We examine waffle-rib structural systems, interlocking finger joints, and unrolling algorithms that flatten double-curved panels with minimal distortion.

Key Topics:
• NURBS surface discretization and developable surface strip unrolling
• CNC 3-axis and 5-axis milling toolpath generation and kerf compensation
• Interlocking timber waffle joints: friction tolerances, mortise-and-tenon detailing

Assignment Exercise:
Prepare a complete digital fabrication sheet for a 1:1 scale pavilion node. Generate unrolled cut sheets with numbered labels, alignment notches, and material thickness specifications.`,
      videoPattern: "testsrc2",
      videoFreq: 660,
      pdfTitle: "Digital Fabrication & CNC Material Tectonics",
      pdfSubtitle: "CNC Waffle Rib Detailing & Developable Surface Unroll Specs",
    },
  ];

  // 3. Create Course and Lesson Records
  const courseId = new mongoose.Types.ObjectId();
  const createdLessons = [];

  for (let i = 0; i < lessonSpecs.length; i++) {
    const spec = lessonSpecs[i];
    const lessonDoc = await Lesson.create({
      _id: new mongoose.Types.ObjectId(),
      id: spec.id,
      slug: spec.slug,
      title: spec.title,
      sheetRef: spec.sheetRef,
      duration: spec.duration,
      order: i + 1,
      summary: spec.summary,
      content: spec.content,
      previewImage: coverUpload.url,
      videoAvailable: false,
      videoProcessingStatus: "queued",
      documentAvailable: false,
    });
    createdLessons.push({ lesson: lessonDoc, spec });
  }

  const courseDoc = await Course.create({
    _id: courseId,
    id: DEMO_COURSE_SLUG,
    slug: DEMO_COURSE_SLUG,
    title: "Parametric Form & Algorithmic Design",
    description:
      "A comprehensive masterclass on computational form generation, responsive facade kinetics, solar optimization, and digital fabrication tectonics.",
    level: "Masterclass",
    instructor: INSTRUCTOR_NAME,
    price: "EGP 24,000",
    lessons: createdLessons.map((item) => item.lesson._id),
    relatedProductIds: productIds,
  });

  console.log(`[OK] Created Course "${courseDoc.title}" (${courseDoc.slug})`);

  // 4. Create Video and Document Assets for Each Lesson
  const workDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "seed-demo-course-"));

  try {
    for (const item of createdLessons) {
      const { lesson, spec } = item;
      console.log(`\nProcessing Lesson: ${spec.title}...`);

      // A. Document Upload
      const pdfBuffer = generatePdfBuffer({
        sheetNumber: spec.sheetRef,
        title: spec.pdfTitle,
        subtitle: spec.pdfSubtitle,
      });
      const docAssetId = new mongoose.Types.ObjectId();
      const docObjectKey = buildLessonDocKey(
        courseDoc._id.toString(),
        lesson._id.toString(),
        docAssetId.toString(),
        `${spec.sheetRef}_Drawing_Sheet.pdf`
      );

      await putPrivateObject({
        objectKey: docObjectKey,
        body: pdfBuffer,
        contentType: "application/pdf",
        contentDisposition: `inline; filename="${spec.sheetRef}_Drawing_Sheet.pdf"`,
      });

      const docAsset = await DocumentAsset.create({
        _id: docAssetId,
        lessonId: lesson._id,
        courseId: courseDoc._id,
        generation: 1,
        status: "ready",
        objectKey: docObjectKey,
        filename: `${spec.sheetRef}_Drawing_Sheet.pdf`,
        contentType: "application/pdf",
        sizeBytes: pdfBuffer.length,
      });

      await Lesson.findByIdAndUpdate(lesson._id, {
        documentObjectKey: docObjectKey,
        documentAvailable: true,
        documentOriginalFilename: docAsset.filename,
        documentAssetId: docAsset._id,
        documentGeneration: 1,
      });
      console.log(`  [OK] PDF Document attached -> ${docObjectKey}`);

      // B. Video Generation, Upload & Transcoding
      const videoFilename = `${spec.slug}.mp4`;
      const videoFilePath = path.join(workDir, videoFilename);
      generateVideo({
        destination: videoFilePath,
        pattern: spec.videoPattern,
        freq: spec.videoFreq,
        duration: 4,
      });

      const videoStat = await fs.promises.stat(videoFilePath);
      const videoAssetId = new mongoose.Types.ObjectId();
      const generatedKey = generateWrappedContentKey();
      const encryption = generatedKey.encryption;
      generatedKey.contentKey.fill(0);

      const videoSourceKey = buildVideoAssetSourceKey(
        courseDoc._id.toString(),
        lesson._id.toString(),
        videoAssetId.toString(),
        videoFilename
      );
      const outputPrefix = buildVideoAssetOutputPrefix(
        courseDoc._id.toString(),
        lesson._id.toString(),
        videoAssetId.toString()
      );

      await new Upload({
        client: r2Client,
        params: {
          Bucket: privateConfig.bucketName,
          Key: videoSourceKey,
          Body: fs.createReadStream(videoFilePath),
          ContentLength: videoStat.size,
          ContentType: "video/mp4",
          ContentDisposition: "inline",
          Metadata: {
            courseId: courseDoc._id.toString(),
            lessonId: lesson._id.toString(),
          },
        },
      }).done();

      const videoAsset = await VideoAsset.create({
        _id: videoAssetId,
        lessonId: lesson._id,
        courseId: courseDoc._id,
        generation: 1,
        status: "queued",
        source: {
          objectKey: videoSourceKey,
          filename: videoFilename,
          contentType: "video/mp4",
          sizeBytes: videoStat.size,
        },
        outputPrefix,
        encryption,
      });

      await Lesson.findByIdAndUpdate(lesson._id, {
        videoAssetId: videoAsset._id,
        videoAvailable: false,
        videoOriginalFilename: videoFilename,
        videoProcessingStatus: "queued",
        videoGeneration: 1,
        videoProcessingUpdatedAt: new Date(),
      });

      const processingJob = await VideoProcessingJob.create({
        assetId: videoAsset._id,
        lessonId: lesson._id,
        status: "queued",
        attempts: 0,
        maxAttempts: 5,
        availableAt: new Date(),
      });

      // Claim and process job with FFmpeg worker
      const workerConfig = {
        ...getVideoProcessingConfig(),
        workerId: `demo-seeder-${Date.now()}`,
      };

      const claimedJob = await VideoProcessingJob.findOneAndUpdate(
        { _id: processingJob._id, status: "queued" },
        {
          $set: {
            status: "processing",
            startedAt: new Date(),
            "lease.ownerId": workerConfig.workerId,
            "lease.heartbeatAt": new Date(),
            "lease.expiresAt": new Date(Date.now() + workerConfig.leaseMs),
          },
          $inc: { attempts: 1 },
        },
        { new: true }
      );

      await handleClaimedJob(claimedJob, workerConfig);

      const processedAsset = await VideoAsset.findById(videoAsset._id);
      console.log(
        `  [OK] Encrypted HLS Transcoding completed -> Status: ${processedAsset.status}, Renditions: ${processedAsset.renditions?.map((r) => r.name).join(", ")}`
      );
    }
  } finally {
    await fs.promises.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }

  // 5. Create CourseGroup
  const groupDoc = await CourseGroup.create({
    title: "Parametric Design & Digital Architecture",
    subtitle: "Advanced computational masterclass on algorithmic geometry, environmental envelopes, and digital fabrication",
    type: "diploma",
    courses: [courseDoc._id],
    bundlePrice: "EGP 24,000",
  });
  console.log(`\n[OK] Created CourseGroup "${groupDoc.title}"`);

  // 6. Enroll Users (Admins and Students)
  const users = await User.find({});
  let enrolledCount = 0;
  for (const user of users) {
    await Enrollment.findOneAndUpdate(
      { userId: user._id, courseId: courseDoc._id },
      {
        $set: {
          userId: user._id,
          courseId: courseDoc._id,
          paymentStatus: "completed",
          completedLessons: [],
          totalLessons: createdLessons.length,
        },
      },
      { upsert: true, new: true }
    );
    enrolledCount++;
  }
  console.log(`[OK] Enrolled ${enrolledCount} users into demo course for instant access.`);

  console.log("\n===============================================================");
  console.log("               DEMO COURSE SUCCESSFULLY SEEDED!                ");
  console.log("===============================================================");
  console.log(`Course Title:       ${courseDoc.title}`);
  console.log(`Course Slug:        ${DEMO_COURSE_SLUG}`);
  console.log(`Course URL:         http://localhost:3000/courses/${DEMO_COURSE_SLUG}`);
  console.log(`Lesson 1 URL:       http://localhost:3000/courses/${DEMO_COURSE_SLUG}/${lessonSpecs[0].slug}`);
  console.log(`Lesson 2 URL:       http://localhost:3000/courses/${DEMO_COURSE_SLUG}/${lessonSpecs[1].slug}`);
  console.log(`Lesson 3 URL:       http://localhost:3000/courses/${DEMO_COURSE_SLUG}/${lessonSpecs[2].slug}`);
  console.log(`Cover Image:        ${coverUpload.url}`);
  console.log(`Lessons Count:      ${createdLessons.length} (all with encrypted HLS video & PDF docs)`);
  console.log("===============================================================\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("FATAL ERROR seeding demo course:", err);
  process.exit(1);
});
