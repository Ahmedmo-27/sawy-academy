const { toSlug } = require("../../utils/slug");
const { formatSheetRef } = require("../../utils/sheet");

/** Source: lib/data/portfolio.ts */
const rawProjects = [
  {
    id: "1",
    title: "Atrium House",
    category: "Buildings",
    year: "2024",
    image: "/images/portfolio/atrium-house.jpg",
    aspect: "tall",
  },
  {
    id: "2",
    title: "Nordic Pavilion",
    category: "Competitions",
    year: "2023",
    image: "/images/portfolio/nordic-pavilion.jpg",
    aspect: "wide",
  },
  {
    id: "3",
    title: "Timber Workshop",
    category: "Interiors",
    year: "2024",
    image: "/images/portfolio/timber-workshop.jpg",
    aspect: "square",
  },
  {
    id: "4",
    title: "Coastal Villa",
    category: "Buildings",
    year: "2022",
    image: "/images/portfolio/coastal-villa.jpg",
    aspect: "tall",
  },
  {
    id: "5",
    title: "Reading Room",
    category: "Interiors",
    year: "2023",
    image: "/images/portfolio/reading-room.jpg",
    aspect: "wide",
  },
  {
    id: "6",
    title: "Oak Bench Series",
    category: "Furniture",
    year: "2024",
    image: "/images/portfolio/oak-bench.jpg",
    aspect: "square",
  },
  {
    id: "7",
    title: "Urban Canopy",
    category: "Competitions",
    year: "2022",
    image: "/images/portfolio/urban-canopy.jpg",
    aspect: "wide",
  },
  {
    id: "8",
    title: "Courtyard Residence",
    category: "Buildings",
    year: "2021",
    image: "/images/portfolio/courtyard-residence.jpg",
    aspect: "tall",
  },
  {
    id: "9",
    title: "Ceramic Table",
    category: "Furniture",
    year: "2023",
    image: "/images/portfolio/ceramic-table.jpg",
    aspect: "square",
  },
];

const projects = rawProjects.map((project, index) => ({
  ...project,
  slug: toSlug(project.title),
  sheetRef: formatSheetRef(index),
}));

module.exports = projects;
