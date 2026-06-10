import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "primary.jwwb.nl",
        pathname: "/**",
      },
      // Supabase storage (admin-uploaded hero overrides + blog covers) — lets
      // next/image optimize them instead of the `unoptimized` escape hatch.
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "majorillegarden.nl",
        "www.majorillegarden.nl",
      ],
      bodySizeLimit: "100kb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Enforced CSP — covers the actual third-party surface (Cal.com
          // embed + popup, Mollie checkout, Supabase auth/realtime/storage,
          // Vercel analytics, Google Fonts fallback).
          // `unsafe-inline` on script-src is required
          // for Next.js hydration bootstrap scripts; tighten via nonces only
          // if a real XSS lands and you've got the budget to test every page.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://app.cal.com https://cal.com https://*.vercel-scripts.com https://va.vercel-scripts.com",
              "frame-src https://app.cal.com https://cal.com https://*.mollie.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://app.cal.com https://api.cal.com https://va.vercel-scripts.com",
              // Explicit allowlist — the previous bare `https:` allowed any
              // origin, which defeats img-src as an exfiltration barrier.
              "img-src 'self' data: blob: https://primary.jwwb.nl https://*.supabase.co https://app.cal.com https://cal.com",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data: https://fonts.gstatic.com",
              "form-action 'self' https://www.mollie.com https://*.mollie.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
