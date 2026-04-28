/** @type {import("next").NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-sqlite3", "bindings"],
  // Default Server Actions body limit is ~1MB; product form sends multipart image + fields.
  // Uploads capped at 4MB in src/lib/uploads.ts — allow headroom above that.
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
