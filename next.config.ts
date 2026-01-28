import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",

  // Skip linting and type checking during Docker builds
  // These checks should run in CI, not during image creation
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8003",
        pathname: "/api/v1/**",
      },
      {
        protocol: "https",
        hostname: "api.ug.lawlens.io",
        pathname: "/api/v1/**",
      },
    ],
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8003/api/v1",
  },

  // Turbopack configuration (Next.js 16+ default bundler)
  // Root must be set explicitly for monorepo Docker builds
  turbopack: {
    root: "..",
  },
};

export default nextConfig;
