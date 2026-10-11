export type ConfigMaterial = {
  titulo: string;
  texto: string;
  estabelecimento: string;
  logo?: string; // data URL
  cor: string;
  fundo: string;
  mostrarChave: boolean;
  mostrarValor: boolean;
  mostrarNome: boolean;
  tamanhoQr: number; // mm na escala do cartaz A4
};

export type InfoPix = { qr: string; chave: string; rotuloChave: string; valor?: string; nome: string };

// Texto escuro ou claro conforme o fundo, para manter o contraste.
function corDoTexto(fundo: string) {
  const n = parseInt(fundo.slice(1), 16);
  const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 150 ? "#18181b" : "#ffffff";
}

// Um material. Desenhado na proporção A (1:√2); "escala" 1 = A4, ~0.7 = A5, 0.5 = A6 (cartão de mesa).
export function MaterialPix({ config: c, info, escala }: { config: ConfigMaterial; info: InfoPix; escala: number }) {
  const mm = (n: number) => `${n * escala}mm`;
  const texto = corDoTexto(c.fundo);
  return (
    <div
      className="flex h-full w-full flex-col items-center overflow-hidden text-center"
      style={{ padding: mm(14), background: c.fundo, color: texto }}
    >
      {c.logo && (
        // eslint-disable-next-line @next/next/no-img-element -- imagem local do usuário (data URL)
        <img src={c.logo} alt="" className="object-contain" style={{ maxHeight: mm(26), maxWidth: mm(90), marginBottom: mm(4) }} />
      )}
      {c.estabelecimento && (
        <p className="font-semibold uppercase tracking-[0.15em] opacity-80" style={{ fontSize: mm(6) }}>
          {c.estabelecimento}
        </p>
      )}
      <h2 className="font-extrabold leading-tight" style={{ color: c.cor, fontSize: mm(17), marginTop: mm(2) }}>
        {c.titulo}
      </h2>
      {c.texto && (
        <p className="leading-snug opacity-80" style={{ fontSize: mm(6), marginTop: mm(3), maxWidth: mm(160) }}>
          {c.texto}
        </p>
      )}
      {/* Fundo branco e margem em volta do QR sempre: nada do desenho encosta no código. */}
      <div className="shrink-0 bg-white" style={{ marginTop: mm(8), padding: mm(4), borderRadius: mm(5), border: `${mm(1.5)} solid ${c.cor}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG gerado no navegador, sai em vetor na impressão */}
        <img src={info.qr} alt="QR code Pix" className="block" style={{ width: mm(c.tamanhoQr), height: mm(c.tamanhoQr) }} />
      </div>
      {c.mostrarValor && info.valor && (
        <p className="font-bold" style={{ fontSize: mm(12), marginTop: mm(5) }}>
          {info.valor}
        </p>
      )}
      <div className="leading-snug" style={{ fontSize: mm(5), marginTop: mm(4) }}>
        {c.mostrarNome && <p className="font-semibold">{info.nome}</p>}
        {c.mostrarChave && (
          <p className="break-all opacity-80">
            Chave {info.rotuloChave}: {info.chave}
          </p>
        )}
      </div>
      <p className="mt-auto opacity-60" style={{ fontSize: mm(4.2), paddingTop: mm(3) }}>
        Abra o app do seu banco, escolha Pix e “Ler QR code”
      </p>
    </div>
  );
}
