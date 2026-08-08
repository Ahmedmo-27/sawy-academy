import { ImageResponse } from "next/og";

export const alt = "Sawy Academy architectural studio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f5f3ef",
          color: "#242321",
          padding: "72px 82px",
          border: "18px solid #242321",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            letterSpacing: 5,
            textTransform: "uppercase",
          }}
        >
          <span>Architecture · Education · Studio</span>
          <span>1:100</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ width: 150, height: 8, background: "#8b5a4a" }} />
          <div style={{ fontSize: 92, fontWeight: 600, letterSpacing: -4 }}>
            Sawy Academy
          </div>
          <div style={{ fontSize: 36, color: "#5b5751" }}>
            Prof. Mohamed El Sawy · Cairo
          </div>
        </div>
      </div>
    ),
    size
  );
}
