import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Endereço antigo da Vercel -> domínio próprio (links e QR codes já distribuídos continuam valendo).
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "envia-ai-topaz.vercel.app" }],
        destination: "https://enviaai.site/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
