// Busca simples por GET (?q=), sem JavaScript no cliente.
export function Busca({ placeholder, valor }: { placeholder: string; valor?: string }) {
  return (
    <form className="flex gap-2">
      <input name="q" defaultValue={valor} placeholder={placeholder} className="campo w-full max-w-sm" />
      <button className="btn-secundario">Buscar</button>
    </form>
  );
}

// Escapa o texto digitado para usar numa regex do MongoDB.
export function regexBusca(q: string) {
  return new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}
