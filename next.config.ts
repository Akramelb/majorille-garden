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
    ],
  },
};

export default nextConfig;
