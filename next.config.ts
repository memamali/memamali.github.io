import type { NextConfig } from "next";

// GitHub Pages project sites serve from /<repo>, so basePath is injected at build
// time (the deploy workflow sets PAGES_BASE_PATH from the Pages config). Empty for
// local dev and user/custom-domain sites.
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export", // static site (index.html + assets) — hostable on GitHub Pages
  trailingSlash: true, // emit /admin/index.html so deep links resolve on Pages
  images: { unoptimized: true }, // no Next image optimizer in a static export
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
