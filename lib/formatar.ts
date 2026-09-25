// "mauro silva" -> "Mauro"
export function primeiroNome(nome: string) {
  const primeiro = nome.trim().split(/\s+/)[0] ?? "";
  return primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase();
}
