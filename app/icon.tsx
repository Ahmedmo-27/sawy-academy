import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#242321",
          color: "#f5f3ef",
          border: "28px solid #8b5a4a",
          fontSize: 210,
          fontWeight: 600,
          letterSpacing: -18,
        }}
      >
        SA
      </div>
    ),
    size
  );
}
