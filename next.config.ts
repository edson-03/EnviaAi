import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Foto de capa (já reduzida no navegador) é enviada por server action.
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
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
