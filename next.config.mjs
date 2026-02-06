/** @type {import('next').NextConfig} */
const nextConfig = {
    // Ensure we are not statically exporting dynamic routes unexpectedly
    // output: 'standalone', // Optional, good for Docker, Vercel handles standard.
    // Trigger Vercel Rebuild
};

export default nextConfig;
