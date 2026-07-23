/** @type {import('next').NextConfig} */

const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://www.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://*.googleusercontent.com http://localhost:5000 https://i.ytimg.com https://img.youtube.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "connect-src 'self' http://localhost:5000 https://*.sslcommerz.com https://translate.googleapis.com https://api.allorigins.win https://corsproxy.io https://api.codetabs.com https://youtu.be https://www.youtube.com https://*.googleapis.com https://api.darulquranfoundation.org https://api.darulquranwelfareassociation.org https://img.youtube.com",
      "frame-src 'self' https://www.youtube.com https://youtube.com https://*.youtube.com https://img.youtube.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  typedRoutes: true,
  outputFileTracingRoot: process.cwd(),
  async rewrites() {
    const apiBaseUrl =
      process.env.NEXT_PUBLIC_BASE_API || "http://localhost:5000/api/v1";
    return [
      {
        source: "/api/uploads/:path*",
        destination: `${apiBaseUrl}/uploads/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/api/v1/uploads/**",
      },
    ],
  },
};

module.exports = nextConfig;
