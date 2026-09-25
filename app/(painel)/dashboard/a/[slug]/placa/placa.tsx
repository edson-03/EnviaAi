const PASSOS = ["Aponte a câmera do celular para o QR code", "Escolha as fotos e vídeos", "Toque em enviar. Pronto!"];

// Uma placa. "escala" 1 = cartaz A4; 0.5 = cartão de mesa (1/4 da folha).
export function Placa({ titulo, qr, link, cor, escala }: { titulo: string; qr: string; link: string; cor: string; escala: number }) {
  const mm = (n: number) => `${n * escala}mm`;
  return (
    <div
      className="flex h-full w-full flex-col items-center overflow-hidden bg-white text-center text-zinc-900"
      style={{ padding: mm(14) }}
    >
      <p className="font-semibold uppercase tracking-[0.2em]" style={{ color: cor, fontSize: mm(5) }}>
        Compartilhe suas fotos
      </p>
      <h2 className="font-bold leading-tight" style={{ fontSize: mm(13), marginTop: mm(4) }}>
        {titulo}
      </h2>
      <div className="rounded-[6%] border-4" style={{ borderColor: cor, marginTop: mm(10), padding: mm(3), width: mm(110) }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG gerado no servidor, sai em vetor na impressão */}
        <img src={qr} alt="QR code do álbum" className="block h-auto w-full" />
      </div>
      <ol className="text-left" style={{ marginTop: mm(10), fontSize: mm(5.2) }}>
        {PASSOS.map((p, i) => (
          <li key={p} className="flex items-center" style={{ gap: mm(3), marginTop: i ? mm(3) : 0 }}>
            <span
              className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
              style={{ background: cor, width: mm(8), height: mm(8), fontSize: mm(4.5) }}
            >
              {i + 1}
            </span>
            {p}
          </li>
        ))}
      </ol>
      <p className="mt-auto text-zinc-500" style={{ fontSize: mm(4) }}>
        Sem app e sem cadastro · {link.replace(/^https?:\/\//, "")}
      </p>
    </div>
  );
}
