/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingExcludes: {
    "*": ["node_modules/@swc/core*", "node_modules/esbuild*"],
  },
};

module.exports = nextConfig;
