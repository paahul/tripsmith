import { ImageResponse } from "next/og";

export const alt = "tripsmith — a personal travel planner";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#faf6ef",
          color: "#1f1a14",
          padding: "80px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 22,
            letterSpacing: "5px",
            textTransform: "uppercase",
            color: "#b85931",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              background: "#b85931",
              borderRadius: 999,
              display: "flex",
            }}
          />
          A personal travel planner
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
          <div
            style={{
              fontSize: 200,
              lineHeight: 0.95,
              fontWeight: 300,
              letterSpacing: "-6px",
              display: "flex",
            }}
          >
            tripsmith
          </div>
          <div
            style={{
              fontSize: 46,
              lineHeight: 1.15,
              fontWeight: 300,
              fontStyle: "italic",
              color: "#4a4036",
              display: "flex",
            }}
          >
            Tell it how you travel. It plans the trip.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "#8a7b66",
            fontStyle: "italic",
          }}
        >
          Profile-tuned itineraries, day-by-day, in under a minute.
        </div>
      </div>
    ),
    { ...size },
  );
}
