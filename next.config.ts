import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Image uploads go through server actions; allow up to the 8MB the upload
    // code accepts (default is 1MB, which silently fails larger gallery photos).
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
