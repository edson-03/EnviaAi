// Limites compartilhados entre cliente e servidor.
// Teto de segurança; o limite real de cada álbum vem do plano (maxBytesArquivo, em /admin/planos).
export const MAX_FILE_BYTES = 20 * 1024 * 1024 * 1024; // 20 GB
export const MAX_ARQUIVOS_POR_ALBUM = 5000;

// Por IP e por rota. Alto porque convidados de um evento costumam sair pelo mesmo IP.
export const LIMITE_REQUISICOES_IP = 600;
export const JANELA_LIMITE_MS = 10 * 60 * 1000; // 10 min

export function tipoPermitido(mimeType: string) {
  return mimeType.startsWith("image/") || mimeType.startsWith("video/");
}
