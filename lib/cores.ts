// Cores que o organizador pode escolher para a página do convidado.
export const CORES_TEMA = [
  { nome: "Violeta", hex: "#7c3aed" },
  { nome: "Rosa", hex: "#db2777" },
  { nome: "Vermelho", hex: "#dc2626" },
  { nome: "Laranja", hex: "#ea580c" },
  { nome: "Dourado", hex: "#b45309" },
  { nome: "Verde", hex: "#059669" },
  { nome: "Azul", hex: "#2563eb" },
  { nome: "Grafite", hex: "#3f3f46" },
] as const;

export const COR_PADRAO = "#7c3aed";

// Álbuns antigos foram criados com "#18181b" (antes de existir a escolha de cor): mostram o padrão.
export function corDoAlbum(corTema: string) {
  return corTema.toLowerCase() === "#18181b" ? COR_PADRAO : corTema;
}
