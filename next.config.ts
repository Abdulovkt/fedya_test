import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s2.fedorpharmshop.com",
        pathname: "/wp-content/**",
      },
    ],
  },
};

export default nextConfig;
