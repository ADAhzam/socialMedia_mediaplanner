/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pptxgenjs'],
  transpilePackages: ['@smmp/engine'],
};
module.exports = nextConfig;
