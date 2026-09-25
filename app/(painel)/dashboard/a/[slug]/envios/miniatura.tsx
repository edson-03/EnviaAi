"use client";

import { useState } from "react";

// Imagem da grade; se o Drive ainda não gerou a miniatura, mostra um quadro com o tipo.
export function Miniatura({ src, video }: { src: string; video: boolean }) {
  const [erro, setErro] = useState(false);

  if (erro) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center text-xs font-bold ${
          video ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" : "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
        }`}
      >
        {video ? "VÍDEO" : "FOTO"}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- miniatura servida pela nossa rota (privada)
    <img src={src} alt="" loading="lazy" onError={() => setErro(true)} className="h-full w-full object-cover" />
  );
}
