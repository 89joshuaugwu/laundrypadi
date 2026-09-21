import { readFile } from "fs/promises";
import { join } from "path";
import { ImageResponse } from "next/og";

export const ogSize = { width: 1200, height: 630 };

/** Branded Open Graph card. Each page passes its own headline so shared links are distinguishable. */
export async function renderOg({ title, subtitle, badge }: { title: string; subtitle: string; badge?: string }) {
  const mark = await readFile(join(process.cwd(), "public/images/logo-mark.png"));
  const src = `data:image/png;base64,${mark.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F7F8F5",
          padding: 72,
          color: "#16332E",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} width={96} height={84} alt="" />
          <div style={{ fontSize: 40, fontWeight: 800 }}>LaundryPadi</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {badge ? (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                background: "#E4F4EB",
                color: "#066759",
                fontSize: 28,
                fontWeight: 700,
                padding: "10px 24px",
                borderRadius: 999,
              }}
            >
              {badge}
            </div>
          ) : null}
          <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>{title}</div>
          <div style={{ fontSize: 34, color: "#465F59" }}>{subtitle}</div>
        </div>

        <div style={{ display: "flex", height: 12, width: 220, background: "#087F6D", borderRadius: 999 }} />
      </div>
    ),
    { ...ogSize },
  );
}
