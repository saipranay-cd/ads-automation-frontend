import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.fbsbx.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "**.facebook.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "tpc.googlesyndication.com" },
      { protocol: "https", hostname: "**.ggpht.com" },
    ],
  },
};

export default nextConfig;
