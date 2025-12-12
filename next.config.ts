import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: "C:\\Users\\shash\\Desktop\\preper",
  experimental:{
    useCache: true,
    serverActions:{
      allowedOrigins: [
        "localhost:3000",
        "hc3lft17-3000.inc1.devtunnels.ms",
      ],
    }
  }
};

export default nextConfig;
