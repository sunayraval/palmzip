import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/umich",
        destination: "https://youtu.be/aji7tYSTURc",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
