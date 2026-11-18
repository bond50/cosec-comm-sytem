import path from "node:path";
import type { NextConfig } from "next";

const isWindows = process.platform === "win32";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: ["192.168.131.6"],

  turbopack: {
    root: path.join(__dirname),
  },

  ...(isWindows ? {} : { output: "standalone" }),

  ...(process.env.NODE_ENV !== "production"
    ? {
        logging: {
          fetches: {
            fullUrl: true,
          },
        },
      }
    : {}),

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
};

export default nextConfig;
