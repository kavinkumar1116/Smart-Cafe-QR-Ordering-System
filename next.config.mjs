/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xczrlcoynkpnwbdqgmww.supabase.co",
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/assets/:path*",
          destination: "/_next/static/assets/:path*",
        },
      ],
    };
  },
};

export default nextConfig;