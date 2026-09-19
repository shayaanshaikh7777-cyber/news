import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  outputFileTracingIncludes: {
    "/api/**/*": ["./node_modules/.prisma/client/**/*", "./prisma/migrations/**/*"],
    "/**/*": ["./node_modules/.prisma/client/**/*", "./prisma/migrations/**/*"],
  },
};

export default nextConfig;

