import { BRAND } from "@/lib/branding";
import { formatSheetRef } from "@/lib/sheet";

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  sheetRef: string;
  duration: string;
  order: number;
  summary: string;
  content: string;
  videoUrl?: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  instructor: string;
  price: string;
  lessons: Lesson[];
  relatedProductIds: string[];
}

export type CourseGroupType = "diploma" | "leveled";

export interface CourseGroup {
  title: string;
  subtitle: string;
  type: CourseGroupType;
  courses: Course[];
  bundlePrice?: string;
}

function buildLessons(
  prefix: string,
  lessons: Omit<Lesson, "sheetRef" | "order">[]
): Lesson[] {
  return lessons.map((lesson, i) => ({
    ...lesson,
    order: i + 1,
    sheetRef: formatSheetRef(i, prefix),
  }));
}

export const courseGroups: CourseGroup[] = [
  {
    title: "Architecture Diploma",
    subtitle: "A structured diploma programme of core architectural courses",
    type: "diploma",
    bundlePrice: "EGP 52,000",
    courses: [
      {
        id: "d1",
        slug: "spatial-composition-i",
        title: "Spatial Composition I",
        description:
          "Fundamentals of proportion, scale, and the relationship between void and mass in architectural space.",
        level: "Core",
        instructor: BRAND.professorTitle,
        price: "EGP 18,500",
        relatedProductIds: ["p6", "p3"],
        lessons: buildLessons("SC", [
          {
            id: "d1-l1",
            slug: "proportion-and-module",
            title: "Proportion and the Module",
            duration: "45 min",
            summary:
              "Introduce the 8px / modular grid as a compositional instrument.",
            content:
              "Proportion is not decoration — it is the primary structure of spatial order. In this sheet we establish the academy's modular discipline: an 8-unit base that governs margins, type, and bay widths.\n\nBegin by measuring familiar rooms against a consistent module. Note where voids feel generous versus compressed. The goal is not a formula, but a calibrated eye.\n\nExercise: redraw a simple plan using only multiples of the module. Record where the grid resists the programme, and where it clarifies it.",
          },
          {
            id: "d1-l2",
            slug: "void-and-mass",
            title: "Void and Mass",
            duration: "50 min",
            summary: "Read space as the figure between solids.",
            content:
              "Architecture is as much about what is left open as what is built. Mass defines edge; void carries light, movement, and occupation.\n\nWe study paired plans — solid poche versus open field — and annotate thresholds where mass yields to void. Thresholds are not doors alone; they are changes in scale, light, and material.\n\nExercise: produce a poche drawing of a known interior. Fill solids dark; leave voids white. Label three thresholds by type: entry, pause, and release.",
          },
          {
            id: "d1-l3",
            slug: "scale-and-occupation",
            title: "Scale and Occupation",
            duration: "55 min",
            summary: "Relate human measure to room dimension.",
            content:
              "Scale is the relationship between body and enclosure. A room that measures correctly on paper may still fail in occupation if ceiling height, bay width, or furniture clearances ignore the body.\n\nWe introduce scale bars as reading tools — not only drawing conventions. Every sheet in this academy carries a scale mark for that reason.\n\nExercise: photograph a corner of your workspace. Overlay a scale bar and annotate sitting, standing, and reach heights. Propose one adjustment that improves occupation without changing footprint.",
          },
          {
            id: "d1-l4",
            slug: "composition-studio-brief",
            title: "Composition Studio Brief",
            duration: "90 min",
            summary: "Apply proportion, void, and scale to a single-room brief.",
            content:
              "This culminating sheet asks for a single-room pavilion: entry, pause, and outlook. Use the module, declare a primary void, and keep the material palette to two finishes.\n\nDeliverables: plan at 1:50, section at 1:50, and a short title block stating intent in one sentence.\n\nCritique criteria: clarity of module, legibility of void, and honesty of scale.",
          },
        ]),
      },
      {
        id: "d2",
        slug: "drawing-and-representation",
        title: "Drawing & Representation",
        description:
          "Orthographic projection, section drawing, and the conventions of architectural documentation.",
        level: "Core",
        instructor: BRAND.professorTitle,
        price: "EGP 16,800",
        relatedProductIds: ["p2", "p6", "p5"],
        lessons: buildLessons("DR", [
          {
            id: "d2-l1",
            slug: "orthographic-conventions",
            title: "Orthographic Conventions",
            duration: "40 min",
            summary: "Plan, elevation, and the shared language of projection.",
            content:
              "Orthographic drawing is the academy's primary documentation language. Plans cut horizontally; elevations project vertically without perspective distortion.\n\nLine weight hierarchy communicates depth: cut lines heaviest, edges medium, beyond light. Hairlines are reserved for guides and dimension strings.\n\nExercise: redraw a simple object in plan and two elevations. Enforce three line weights only.",
          },
          {
            id: "d2-l2",
            slug: "the-section-cut",
            title: "The Section Cut",
            duration: "50 min",
            summary: "Reveal structure, void, and material through the cut.",
            content:
              "A section is an argument about what matters inside the building. The cut plane should pass through the most informative sequence — stair, void, or structural bay — not merely the geometric centre.\n\nPoche the cut solid. Beyond the cut, draw what remains visible with lighter weight. Annotate material only where the cut exposes it.\n\nExercise: section an existing room through its primary void. Include a scale bar and sheet reference.",
          },
          {
            id: "d2-l3",
            slug: "sheet-composition",
            title: "Sheet Composition",
            duration: "45 min",
            summary: "Title blocks, sheet refs, and drawing-set order.",
            content:
              "A drawing set is a building explained in sequence. Sheet references (A-01, SC-02) locate each drawing within that set. Title blocks carry project, author, scale, and date — the same discipline used across this site.\n\nLayout follows bay logic: primary drawing dominates; notes and keys occupy secondary bays. Never crowd the cut.\n\nExercise: compose a single sheet with plan, section, and title block. Number it as sheet 01 of a fictional set.",
          },
          {
            id: "d2-l4",
            slug: "representation-review",
            title: "Representation Review",
            duration: "60 min",
            summary: "Critique drawings for clarity, weight, and intent.",
            content:
              "Review is not taste — it is verification that the drawing communicates. We ask: Can another architect build from this? Is the cut informative? Does line weight tell the truth?\n\nBring the orthographic set from prior sheets. Pin up. Annotate revisions in clay-coloured pencil only — one colour for critique keeps the original drawing legible.\n\nDeliverable: revised sheet 01 with a short revision note in the title block.",
          },
        ]),
      },
      {
        id: "d3",
        slug: "material-studies",
        title: "Material Studies",
        description:
          "Hands-on exploration of timber, concrete, and stone — their properties, joints, and expressive potential.",
        level: "Core",
        instructor: BRAND.professorTitle,
        price: "EGP 19,900",
        relatedProductIds: ["p4", "p8"],
        lessons: buildLessons("MS", [
          {
            id: "d3-l1",
            slug: "timber-joints",
            title: "Timber and Joint",
            duration: "55 min",
            summary: "Grain, connection, and the ethics of assembly.",
            content:
              "Timber expresses how it was joined. A honest joint is readable; a concealed one must still be structurally true.\n\nWe examine lap, mortise, and butt conditions at model scale. Record grain direction relative to load.\n\nExercise: build three joints at 1:2. Photograph each with a scale bar in frame.",
          },
          {
            id: "d3-l2",
            slug: "concrete-and-form",
            title: "Concrete and Form",
            duration: "50 min",
            summary: "Formwork as the negative of finished surface.",
            content:
              "Concrete remembers its formwork. Board-marked, smooth, or aggregate-exposed finishes are decisions made before the pour.\n\nStudy local examples in Cairo — note cold joints, tie holes, and edge conditions. These are not defects when intentional; they are the material's autobiography.\n\nExercise: design a formwork panel for a 600×600 sample. Specify release, edge chamfer, and tie layout.",
          },
          {
            id: "d3-l3",
            slug: "stone-and-bearing",
            title: "Stone and Bearing",
            duration: "45 min",
            summary: "Weight, coursing, and compressive honesty.",
            content:
              "Stone wants to stack. Its expressive potential lies in coursing, joint thickness, and the transfer of load to the ground.\n\nWe contrast veneer with bearing wall — one is cladding, the other is structure. The academy prefers clarity about which is which.\n\nExercise: draw a short elevation of a coursed wall with a lintel condition. Dimension joint and course heights.",
          },
          {
            id: "d3-l4",
            slug: "material-palette-brief",
            title: "Material Palette Brief",
            duration: "75 min",
            summary: "Compose a three-material palette for a studio project.",
            content:
              "Limit yourself to timber, concrete, and stone — or a reasoned substitute for one. State primary structure, secondary finish, and accent.\n\nDeliverables: material board (physical or photographed), joint detail at 1:5, and a 150-word rationale.\n\nCritique asks whether the palette is hierarchical or merely collected.",
          },
        ]),
      },
      {
        id: "d4",
        slug: "design-studio-i",
        title: "Design Studio I",
        description:
          "Integrated design project applying composition, drawing, and material knowledge to a built-form brief.",
        level: "Core",
        instructor: BRAND.professorTitle,
        price: "EGP 22,000",
        relatedProductIds: ["p1", "p5", "p3"],
        lessons: buildLessons("DS", [
          {
            id: "d4-l1",
            slug: "brief-and-site",
            title: "Brief and Site",
            duration: "60 min",
            summary: "Read the brief; measure the site; state a position.",
            content:
              "Studio begins with constraints. Programme, orientation, and context are not obstacles — they are the material of design.\n\nProduce a site plan at 1:200 with north, access, and primary views. Write a one-sentence design position before sketching form.\n\nNo massing until the position is clear.",
          },
          {
            id: "d4-l2",
            slug: "parti-and-bay",
            title: "Parti and Bay",
            duration: "70 min",
            summary: "Establish organisational diagram and structural bay.",
            content:
              "The parti is the idea reduced to a diagram. The bay is that idea made buildable — a repeated structural and spatial unit.\n\nDevelop three partis. Select one. Overlay a bay grid and test whether the programme fits without breaking the diagram.\n\nDeliverable: parti sheet with bay overlay and a short rejection note for the two discarded options.",
          },
          {
            id: "d4-l3",
            slug: "developed-drawings",
            title: "Developed Drawings",
            duration: "90 min",
            summary: "Plan, section, and elevation at presentation scale.",
            content:
              "Develop the selected parti into a coordinated set: plan 1:100, section 1:100, street elevation 1:100. Maintain sheet references and scale bars.\n\nMaterial decisions from Material Studies should appear in section poche and elevation texture — not as afterthought labels.\n\nPin-up ready: title block complete, north arrow, and sheet index.",
          },
          {
            id: "d4-l4",
            slug: "final-critique",
            title: "Final Critique",
            duration: "120 min",
            summary: "Present the set; defend decisions; record revisions.",
            content:
              "Critique is a public drawing review. Speak from the sheets — not from a separate script. Point to the parti, the bay, and the cut that proves the void.\n\nAfter critique, produce a revision list of no more than five items. The academy values decisive editing over endless addition.\n\nArchive the set with sheet refs intact for your portfolio.",
          },
        ]),
      },
    ],
  },
  {
    title: "Biogeometry",
    subtitle:
      "A three-level course on form, energy, and proportion in the built environment",
    type: "leveled",
    courses: [
      {
        id: "b1",
        slug: "biogeometry-level-01",
        title: "Biogeometry — Level 01",
        description:
          "Introduction to biogeometric principles: proportion, sacred geometry, and the relationship between form and living energy in space.",
        level: "Level 01 / 03",
        instructor: BRAND.professorTitle,
        price: "EGP 14,500",
        relatedProductIds: ["p6", "p7"],
        lessons: buildLessons("BG", [
          {
            id: "b1-l1",
            slug: "principles-of-form",
            title: "Principles of Form",
            duration: "40 min",
            summary: "Introduce biogeometric proportion as a design lens.",
            content:
              "Biogeometry studies how form influences the qualitative character of space. Level 01 establishes vocabulary: centre, axis, harmonic ratio, and energetic balance — always grounded in measurable geometry.\n\nWe begin with simple planar figures and their centres. Locate centres by construction, not estimation.\n\nExercise: construct a square, its diagonals, and nested harmonic subdivisions. Label ratios.",
          },
          {
            id: "b1-l2",
            slug: "sacred-geometry-basics",
            title: "Sacred Geometry Basics",
            duration: "50 min",
            summary: "Circle, square, and the vesica as spatial generators.",
            content:
              "Classical constructions — circle, square, vesica piscis — appear across architectural history because they organise both plan and elevation with economy.\n\nPractice constructions with compass and straightedge. Translate one construction into a room proportion.\n\nExercise: design a square room whose window bay derives from a vesica construction.",
          },
          {
            id: "b1-l3",
            slug: "space-and-energy",
            title: "Space and Living Energy",
            duration: "45 min",
            summary: "Relate geometric centres to occupation and rest.",
            content:
              "Where we sit, pause, and gather often coincides with geometric centres or axes — whether designed intentionally or discovered in use.\n\nMap a familiar interior: furniture, paths, and rest points. Overlay geometric centres from Level 01 constructions. Note alignments and conflicts.\n\nExercise: propose one furniture shift that strengthens a centre without adding objects.",
          },
        ]),
      },
      {
        id: "b2",
        slug: "biogeometry-level-02",
        title: "Biogeometry — Level 02",
        description:
          "Applied biogeometry for site analysis, interior layout, and integrating geometric principles into architectural design.",
        level: "Level 02 / 03",
        instructor: BRAND.professorTitle,
        price: "EGP 18,000",
        relatedProductIds: ["p4", "p3"],
        lessons: buildLessons("BG", [
          {
            id: "b2-l1",
            slug: "site-harmonic-analysis",
            title: "Site Harmonic Analysis",
            duration: "55 min",
            summary: "Extend geometric reading to site and orientation.",
            content:
              "Level 02 moves outdoors. Site axes, access vectors, and solar orientation become inputs to harmonic analysis.\n\nSurvey a small site or courtyard. Record north, entries, and dominant views. Construct a geometric overlay that proposes a primary axis.\n\nDeliverable: site sheet with survey notes and harmonic overlay at 1:200.",
          },
          {
            id: "b2-l2",
            slug: "interior-layout-application",
            title: "Interior Layout Application",
            duration: "60 min",
            summary: "Apply centres and axes to furniture and partition layout.",
            content:
              "Interiors are where biogeometric principles meet daily use. Partition placement, desk orientation, and seating groups can reinforce or fracture a room's geometric order.\n\nTake a plan from your practice or study. Propose a layout that respects the primary centre and secondary axes identified in analysis.\n\nExercise: before/after plans with a short rationale (120 words).",
          },
          {
            id: "b2-l3",
            slug: "design-integration",
            title: "Design Integration",
            duration: "70 min",
            summary: "Integrate biogeometry into an architectural massing study.",
            content:
              "Integration means the geometry is structural to the design — not an applied ornament. Massing, bay, and aperture should share a common generative diagram.\n\nDevelop a small massing study (pavilion or room suite) from a Level 01 construction. Prove the lineage in a diagram sheet.\n\nCritique asks whether removing the diagram would still leave a coherent building.",
          },
        ]),
      },
      {
        id: "b3",
        slug: "biogeometry-level-03",
        title: "Biogeometry — Level 03",
        description:
          "Advanced study and independent project — research-led application of biogeometry to a full design brief with critical review.",
        level: "Level 03 / 03",
        instructor: BRAND.professorTitle,
        price: "EGP 24,000",
        relatedProductIds: ["p1", "p7", "p3"],
        lessons: buildLessons("BG", [
          {
            id: "b3-l1",
            slug: "research-frame",
            title: "Research Frame",
            duration: "50 min",
            summary: "Define a research question and case-study method.",
            content:
              "Level 03 is research-led. State a precise question: How does harmonic centring affect occupation in a specific building type? Select two case studies — one historical, one contemporary.\n\nMethod must be drawable: plans, overlays, and measured observations — not solely prose.\n\nDeliverable: research frame sheet with question, cases, and method diagram.",
          },
          {
            id: "b3-l2",
            slug: "independent-project",
            title: "Independent Project",
            duration: "120 min",
            summary: "Execute the design or analysis project to draft set.",
            content:
              "Produce a draft drawing set answering your research question. Minimum: site/context, geometric analysis, proposed or analysed plan, and one section.\n\nMaintain academy sheet discipline — refs, scales, title blocks. The set is the argument.\n\nSchedule a mid-review with the instructor before finalising.",
          },
          {
            id: "b3-l3",
            slug: "critical-review",
            title: "Critical Review",
            duration: "90 min",
            summary: "Defend findings; archive the final set.",
            content:
              "Present the completed set. Defend the research question, method, and whether the drawings answer what was asked — including negative results.\n\nArchive: PDF set with sheet index, plus a 300-word abstract suitable for the academy research index.\n\nSuccessful completion of Level 03 completes the Biogeometry progression.",
          },
        ]),
      },
    ],
  },
];

export function getAllCourses(): Course[] {
  return courseGroups.flatMap((group) => group.courses);
}

export function getCourseBySlug(slug: string): Course | undefined {
  return getAllCourses().find((course) => course.slug === slug);
}

export function getLessonBySlug(
  course: Course,
  lessonSlug: string
): Lesson | undefined {
  return course.lessons.find((lesson) => lesson.slug === lessonSlug);
}
