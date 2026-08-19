import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    // Images are uploaded to ImgBB from the dashboard and stored as URLs
    // in Firestore (spec C) — Firebase Storage is never used.
    remotePatterns: [
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "i.ibb.co.com" },
      { protocol: "https", hostname: "image.ibb.co" },
    ],
    formats: ["image/avif", "image/webp"],
  },

  typescript: {
    ignoreBuildErrors: false,
  },
};

export default withNextIntl(nextConfig);
