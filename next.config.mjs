/** @type {import('next').NextConfig} */
const nextConfig = {
    // Ensure we are not statically exporting dynamic routes unexpectedly
    // output: 'standalone', // Optional, good for Docker, Vercel handles standard.
};

export default nextConfig;
