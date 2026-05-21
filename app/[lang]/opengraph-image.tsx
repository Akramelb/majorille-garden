import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Majorille Garden — Moroccan-inspired wellness in Amsterdam";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage(props: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await props.params;
  const isNL = lang === "nl";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #2A1810 0%, #4A2A18 50%, #C4633A 100%)",
          padding: "80px",
          color: "#FAF5EC",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div style={{ fontSize: 56, lineHeight: 1, fontWeight: 500 }}>
            Majorille
          </div>
          <div
            style={{
              fontSize: 16,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "#E8A878",
            }}
          >
            Garden
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "900px",
          }}
        >
          <div
            style={{
              fontSize: 84,
              lineHeight: 1.05,
              fontWeight: 500,
            }}
          >
            {isNL
              ? "Marokkaanse wellness in Amsterdam"
              : "Moroccan wellness in Amsterdam"}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#FAF5EC",
              opacity: 0.8,
              fontFamily: "Helvetica, sans-serif",
            }}
          >
            {isNL
              ? "Zandbad · Headspa · Massage · Cupping · Biologische producten"
              : "Sand bath · Headspa · Massage · Cupping · Organic products"}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            width: "100%",
            fontSize: 18,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#E8A878",
            fontFamily: "Helvetica, sans-serif",
          }}
        >
          <div>Franz Zieglerstraat 201 · Amsterdam</div>
          <div>majorillegarden.nl</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
