/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker deployments
  output: "standalone",

  webpack: (config, { isServer }) => {
    // Fix for "Module not found: Can't resolve 'fs'" error when using Pinata SDK
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        path: false,
        os: false,
        crypto: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
