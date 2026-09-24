// Envio para uma sessão resumable do Google Drive, direto do navegador.
//
// O navegador não consegue ler o header "Range" das respostas do Drive (não é
// exposto via CORS). Por isso o arquivo vai numa única requisição (o progresso
// vem de xhr.upload.onprogress) e, se ela falhar, perguntamos ao nosso servidor
// (/api/upload-status) de onde retomar.

export type DriveFile = { id: string; name: string; mimeType: string };

type Status =
  | { completo: true; file: DriveFile }
  | { completo: false; proximoByte: number }
  | { expirada: true };

const MAX_TENTATIVAS = 8;

function put(
  url: string,
  file: File,
  inicio: number,
  onUploadProgress: (loaded: number) => void,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Range", `bytes ${inicio}-${file.size - 1}/${file.size}`);
    xhr.upload.onprogress = (e) => onUploadProgress(e.loaded);
    xhr.onload = () => resolve({ status: xhr.status, body: xhr.responseText });
    xhr.onerror = () => reject(new Error("Falha de rede"));
    xhr.send(file.slice(inicio));
  });
}

async function consultarStatus(uploadUrl: string, size: number): Promise<Status> {
  const res = await fetch("/api/upload-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadUrl, size }),
  });
  if (!res.ok) throw new Error(`Status ${res.status}`);
  return res.json();
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function enviarArquivo(
  file: File,
  uploadUrl: string,
  onProgress: (bytesEnviados: number) => void,
): Promise<DriveFile> {
  let inicio = 0;
  let tentativas = 0;

  while (true) {
    let status = 0;
    try {
      const res = await put(uploadUrl, file, inicio, (loaded) => onProgress(inicio + loaded));
      status = res.status;
      if (status === 200 || status === 201) {
        onProgress(file.size);
        return JSON.parse(res.body) as DriveFile;
      }
    } catch {
      // rede caiu; status fica 0
    }

    if (status === 404 || status === 410) throw new Error("Sessão de upload expirada");
    if (status >= 400 && status < 500) throw new Error(`Upload recusado (${status})`);

    // Rede caiu, erro 5xx ou 308 (Drive não recebeu tudo): pergunta de onde retomar.
    if (++tentativas > MAX_TENTATIVAS) throw new Error("Falha no upload");
    await esperar(Math.min(1000 * 2 ** tentativas, 30000));
    try {
      const st = await consultarStatus(uploadUrl, file.size);
      if ("expirada" in st) throw new Error("Sessão de upload expirada");
      if (st.completo) {
        onProgress(file.size);
        return st.file;
      }
      if (st.proximoByte > inicio) tentativas = 0; // houve avanço
      inicio = st.proximoByte;
      onProgress(inicio);
    } catch (e) {
      if ((e as Error).message === "Sessão de upload expirada") throw e;
      // ainda sem rede; tenta de novo no próximo ciclo
    }
  }
}
