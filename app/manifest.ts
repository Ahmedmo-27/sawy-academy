import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sawy Academy",
    short_name: "Sawy Academy",
    description:
      "Architecture courses, portfolio work, research, and studio resources by Prof. Mohamed El Sawy.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f3ef",
    theme_color: "#8b5a4a",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
