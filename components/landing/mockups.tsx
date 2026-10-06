// Representações das telas reais do Enviaí, desenhadas em código (sem imagens externas).
// As "fotos" são blocos coloridos: não há fotos de clientes nem de banco de imagens.
import { IconeCheck, IconeDrive, IconePasta } from "./icones";

const TONS = [
  "from-rose-300 to-orange-200",
  "from-violet-300 to-fuchsia-200",
  "from-sky-300 to-indigo-200",
  "from-amber-200 to-rose-300",
  "from-emerald-200 to-teal-300",
  "from-fuchsia-300 to-pink-200",
  "from-indigo-300 to-sky-200",
  "from-orange-200 to-amber-300",
];

export function FotoFalsa({ i, className = "" }: { i: number; className?: string }) {
  return <div aria-hidden className={`bg-gradient-to-br ${TONS[i % TONS.length]} ${className}`} />;
}

// Celular do convidado: página do álbum com envios em andamento.
export function MockupCelular() {
  const arquivos = [
    { nome: "IMG_2041.jpg", pct: 100 },
    { nome: "VID_0310.mp4", pct: 64 },
    { nome: "IMG_2045.jpg", pct: 28 },
  ];
  return (
    <div
      role="img"
      aria-label="Celular de um convidado enviando fotos e vídeos para o álbum Casamento Ana e Léo"
      className="relative mx-auto w-[260px] rounded-[2.6rem] border-[10px] border-zinc-900 bg-white shadow-2xl shadow-violet-900/20 dark:border-zinc-700"
    >
      <div className="absolute left-1/2 top-2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-zinc-900 dark:bg-zinc-700" />
      <div className="overflow-hidden rounded-[1.9rem] bg-gradient-to-b from-violet-100 to-white px-4 pb-5 pt-8 text-zinc-900">
        <p className="mx-auto w-fit rounded-full bg-violet-600/10 px-2.5 py-0.5 text-[10px] font-semibold text-violet-700">
          Casamento
        </p>
        <p className="mt-2 text-center text-base font-bold">Ana e Léo</p>
        <p className="text-center text-[11px] text-zinc-500">Compartilhe suas fotos e vídeos deste momento.</p>
        <div className="mt-4 flex flex-col items-center gap-1 rounded-xl border-2 border-dashed border-violet-300 bg-violet-50 py-4">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-violet-600" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs font-semibold text-violet-700">Escolher fotos e vídeos</span>
        </div>
        <ul className="mt-4 space-y-2.5">
          {arquivos.map((a) => (
            <li key={a.nome} className="text-[10px]">
              <div className="flex justify-between text-zinc-600">
                <span>{a.nome}</span>
                <span className={a.pct === 100 ? "font-semibold text-green-600" : ""}>{a.pct === 100 ? "✓ Enviado" : `${a.pct}%`}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-200">
                <div className={`h-full rounded-full ${a.pct === 100 ? "bg-green-500" : "bg-violet-600"}`} style={{ width: `${a.pct}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Cartão com QR code (real, aponta para o site).
export function MockupQr({ qr }: { qr: string }) {
  return (
    <div className="w-44 rounded-2xl bg-white p-3 text-center text-zinc-900 shadow-xl ring-1 ring-zinc-200">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-600">Compartilhe suas fotos</p>
      {/* eslint-disable-next-line @next/next/no-img-element -- QR gerado no servidor */}
      <img src={qr} alt="QR code de exemplo que abre o site do Enviaí" className="mx-auto mt-2 h-28 w-28" />
      <p className="mt-1 text-[10px] text-zinc-500">Aponte a câmera do celular</p>
    </div>
  );
}

// Aviso de arquivo chegando no Drive.
export function MockupNotificacaoDrive() {
  return (
    <div className="flex w-56 items-center gap-3 rounded-2xl bg-white p-3 text-zinc-900 shadow-xl ring-1 ring-zinc-200">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
        <IconeCheck className="h-5 w-5" />
      </span>
      <div className="min-w-0 text-left">
        <p className="truncate text-xs font-semibold">12 fotos novas</p>
        <p className="truncate text-[11px] text-zinc-500">na pasta do álbum, no seu Drive</p>
      </div>
    </div>
  );
}

// Painel do organizador: números e grade de envios.
export function MockupPainel() {
  return (
    <div
      role="img"
      aria-label="Painel do organizador com o total de arquivos, convidados e a grade de fotos recebidas"
      className="overflow-hidden rounded-2xl bg-white text-zinc-900 shadow-2xl ring-1 ring-zinc-200"
    >
      <div className="flex items-center gap-1.5 border-b border-zinc-100 bg-zinc-50 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
        <span className="ml-3 rounded-md bg-white px-3 py-0.5 text-[10px] text-zinc-400 ring-1 ring-zinc-200">enviaai.site/dashboard</span>
      </div>
      <div className="p-4 sm:p-5">
        <p className="text-[11px] font-medium text-violet-600">Casamento</p>
        <p className="text-lg font-bold">Ana e Léo</p>
        <div className="mt-3 flex gap-4 border-b border-zinc-100 text-[11px]">
          {["Visão geral", "Envios", "Mensagens", "Compartilhar"].map((a, i) => (
            <span key={a} className={`pb-2 ${i === 1 ? "border-b-2 border-violet-600 font-semibold text-violet-700" : "text-zinc-400"}`}>
              {a}
            </span>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ["Arquivos", "Fotos e vídeos"],
            ["Convidados", "Quem enviou"],
            ["Recados", "Livro de visitas"],
          ].map(([r, d]) => (
            <div key={r} className="rounded-lg bg-zinc-50 p-2 ring-1 ring-zinc-100">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400">{r}</p>
              <p className="mt-0.5 text-[10px] text-zinc-600">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className={`relative overflow-hidden rounded-md ${i > 7 ? "hidden sm:block" : ""}`}>
              <FotoFalsa i={i} className="aspect-square w-full" />
              {i === 2 && <span className="absolute left-1 top-1 rounded bg-black/50 px-1 text-[8px] font-semibold text-white">▶</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Pasta do álbum no Google Drive do organizador.
export function MockupDrive() {
  const arquivos = [
    ["IMG_2041.jpg", "Enviado por Carla"],
    ["VID_0310.mp4", "Enviado por Pedro"],
    ["IMG_2045.HEIC", "Enviado por Tia Lu"],
    ["Mensagem de voz - Vó.m4a", "Livro de visitas"],
  ];
  return (
    <div
      role="img"
      aria-label="Pasta do álbum no Google Drive do organizador, com os arquivos enviados pelos convidados"
      className="overflow-hidden rounded-2xl bg-white text-zinc-900 shadow-2xl ring-1 ring-zinc-200"
    >
      <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3">
        <IconeDrive className="h-5 w-5 text-zinc-500" />
        <span className="text-sm font-medium">Meu Drive</span>
        <span className="text-zinc-300">›</span>
        <span className="flex items-center gap-1.5 truncate text-sm font-semibold">
          <IconePasta className="h-4 w-4 shrink-0 text-amber-500" />
          Enviaí - Casamento Ana e Léo
        </span>
      </div>
      <ul className="divide-y divide-zinc-100">
        {arquivos.map(([nome, quem], i) => (
          <li key={nome} className="flex items-center gap-3 px-4 py-2.5">
            <FotoFalsa i={i + 3} className="h-8 w-8 shrink-0 rounded" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{nome}</p>
              <p className="truncate text-[11px] text-zinc-500">{quem}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
