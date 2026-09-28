import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// No nonce here deliberately: nonce-based CSP forces every page into
// dynamic rendering (see Next.js's own CSP guide), which would take the
// landing page off static generation — a real regression the project's
// own rules explicitly forbid. 'unsafe-inline' is kept for script/style
// because Next.js's own streaming payload (the inline
// `(self.__next_f=...).push(...)` scripts) and a few inline gradient
// `style` attributes on the landing/auth pages need it without a nonce.
// Everything else here is a real, meaningful restriction regardless:
// no third-party script/style/frame/object origins, no clickjacking,
// no base-tag injection, no cross-origin form submission.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`;

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader.replace(/\s{2,}/g, " ").trim() },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
