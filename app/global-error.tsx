"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "#f5f3ef",
          color: "#1a1a1a",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: 560, border: "1px solid #d4d0c8", padding: 32 }}>
          <p style={{ color: "#8b5a4a", textTransform: "uppercase", letterSpacing: "0.18em" }}>
            Sawy Academy
          </p>
          <h1 style={{ fontWeight: 400 }}>The page structure could not be loaded.</h1>
          <p style={{ color: "#404040", lineHeight: 1.6 }}>
            Please try once more. If the problem continues, return to the homepage.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              minHeight: 44,
              padding: "0 18px",
              border: 0,
              background: "#1a1a1a",
              color: "#f5f3ef",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
