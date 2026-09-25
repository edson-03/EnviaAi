// "mauro silva" -> "Mauro"
export function primeiroNome(nome: string) {
  const primeiro = nome.trim().split(/\s+/)[0] ?? "";
  return primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase();
}

export function formatarBytes(bytes: number) {
  const unidades = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (bytes >= 1024 && i < unidades.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${unidades[i]}`;
}
