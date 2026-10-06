// Imagem de compartilhamento (WhatsApp, redes sociais), gerada pelo Next.js sem dependências extras.
import { ImageResponse } from "next/og";

export const alt = "Enviaí: receba as fotos dos convidados do seu evento por QR code";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #7c3aed 0%, #c026d3 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>Enviaí</div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 68, fontWeight: 700, lineHeight: 1.1, maxWidth: 980 }}>
          Todas as fotos dos seus convidados, reunidas no seu Google Drive
        </div>
        <div style={{ display: "flex", marginTop: 32, fontSize: 32, opacity: 0.9 }}>
          QR code · sem aplicativo · sem login para os convidados
        </div>
      </div>
    ),
    size,
  );
}
