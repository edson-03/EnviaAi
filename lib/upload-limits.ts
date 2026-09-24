// Limites compartilhados entre cliente e servidor.
export const MAX_FILE_BYTES = 4 * 1024 * 1024 * 1024; // 4 GB

export function tipoPermitido(mimeType: string) {
  return mimeType.startsWith("image/") || mimeType.startsWith("video/");
}
