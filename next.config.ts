import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  eslint: {
    // 2. Allows build to finish even if there are linting errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 3. Allows build to finish even if there are minor type errors
    ignoreBuildErrors: true,
  },
  experimental: {
    useCache: true,
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "hc3lft17-3000.inc1.devtunnels.ms",
        "preperapp.vercel.app", 
        "*.vercel.app"       // Allows all vercel preview branches
      ],
    }
  }
};

export default nextConfig;