import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",

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
    root: process.cwd().replace(/\/frontend-public$/, ""),
  },

  webpack: (config) => {
    // Silence known OpenTelemetry dynamic require warning from Sentry server integration.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        message: /Critical dependency: the request of a dependency is an expression/,
        module: /@opentelemetry[\\/]instrumentation/,
      },
    ];
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
