const { toSlug } = require("../../utils/slug");

/** Source: lib/data/researches.ts */
const researches = [
  {
    id: "r1",
    title: "Biogeometric Principles in Contemporary Egyptian Housing",
    year: "2024",
    category: "Published",
    venue: "Journal of Architectural Research, Vol. 18",
    abstract:
      "An investigation into how biogeometric proportion systems can inform residential layout in dense urban contexts, with case studies from Cairo and Giza.",
    collaborators: "Dr. Nadia Hassan",
  },
  {
    id: "r2",
    title: "Material Memory: Earth Construction in the Nile Delta",
    year: "2023",
    category: "Published",
    venue: "Building & Environment, Elsevier",
    abstract:
      "Comparative study of traditional earth-building techniques and their thermal performance, proposing a framework for adaptive reuse in rural housing.",
  },
  {
    id: "r3",
    title: "Sacred Geometry and Spatial Experience in Mosque Architecture",
    year: "2023",
    category: "Conference",
    venue: "International Conference on Islamic Architecture, Istanbul",
    abstract:
      "Paper examining the relationship between geometric ordering systems and perceptual experience in Ottoman-influenced mosque typologies across Egypt.",
  },
  {
    id: "r4",
    title: "Urban Microclimates and Courtyard Morphology",
    year: "2022",
    category: "Published",
    venue: "Urban Climate Journal, Vol. 12",
    abstract:
      "Field measurements and simulation-based analysis of courtyard proportions and their effect on passive cooling in historic Cairo districts.",
    collaborators: "Prof. Karim El-Masry",
  },
  {
    id: "r5",
    title: "Form, Energy, and Proportion: A Biogeometry Design Manual",
    year: "2022",
    category: "Book",
    venue: "Sawy Academy Press",
    abstract:
      "A practitioner-oriented reference on applying biogeometric principles to architectural design — from site analysis through detail resolution.",
  },
  {
    id: "r6",
    title: "Climate-Responsive Facades for Desert Architecture",
    year: "2024",
    category: "Ongoing",
    venue: "Research in progress — Sawy Academy Studio",
    abstract:
      "Ongoing study developing a catalogue of facade strategies for arid climates, integrating traditional mashrabiya logic with contemporary materials.",
  },
  {
    id: "r7",
    title: "Pedagogy of Spatial Drawing: Teaching Architecture by Hand",
    year: "2021",
    category: "Conference",
    venue: "Architectural Education Symposium, Cairo University",
    abstract:
      "Presentation on curriculum design for hand-drawing in digital-era architectural education, drawing on fifteen years of studio teaching.",
  },
  {
    id: "r8",
    title: "Geometric Order in Vernacular Nubian Settlement Patterns",
    year: "2020",
    category: "Published",
    venue: "Habitat International, Vol. 98",
    abstract:
      "Documentation and analysis of settlement geometry in Nubian villages, identifying recurring proportional systems tied to environmental adaptation.",
  },
].map((research) => ({
  ...research,
  slug: toSlug(research.title),
}));

module.exports = researches;
