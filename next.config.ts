import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'lh3.googleusercontent.com',  // Google user avatars
      'avatars.githubusercontent.com',  // GitHub avatars (in case you add GitHub auth)
    ],
  },
};

export default nextConfig;
