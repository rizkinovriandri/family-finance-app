import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1A69FD",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="300" height="300" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
            stroke="white"
            strokeWidth="1.6"
          />
          <path d="M15 13.2a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z" fill="white" />
        </svg>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
