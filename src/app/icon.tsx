import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#b85931",
          color: "#faf6ef",
          fontFamily: "serif",
          fontSize: 44,
          fontWeight: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          letterSpacing: "-2px",
        }}
      >
        t
      </div>
    ),
    { ...size },
  );
}
