// Consulta quantos bytes de uma sessão resumable o Drive já recebeu.
// Existe porque o navegador não consegue ler o header "Range" da resposta do Drive
// (não é exposto via CORS); o servidor lê e devolve o próximo byte a enviar.
// Não exige login: o upload_id da URL já é a credencial da sessão.

const PREFIXO_UPLOAD = "https://www.googleapis.com/upload/drive/v3/files?";

export async function POST(req: Request) {
  const { uploadUrl, size } = await req.json();

  // Só URLs de sessão do Drive (evita usar a rota para chamar outros hosts).
  if (typeof uploadUrl !== "string" || !uploadUrl.startsWith(PREFIXO_UPLOAD) || !uploadUrl.includes("upload_id=")) {
    return Response.json({ erro: "URL inválida" }, { status: 400 });
  }
  if (!Number.isSafeInteger(size) || size <= 0) {
    return Response.json({ erro: "Tamanho inválido" }, { status: 400 });
  }

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Range": `bytes */${size}` },
    body: "",
    redirect: "manual", // 308 aqui significa "incompleto", não redirecionamento
  });

  if (res.status === 200 || res.status === 201) {
    return Response.json({ completo: true, file: await res.json() });
  }
  if (res.status === 308) {
    // "bytes=0-1234" -> 1235; sem header = nada recebido ainda
    const range = res.headers.get("range");
    const proximoByte = range ? Number(range.split("-")[1]) + 1 : 0;
    return Response.json({ completo: false, proximoByte });
  }
  if (res.status === 404 || res.status === 410) {
    return Response.json({ expirada: true });
  }
  return Response.json({ erro: `Drive respondeu ${res.status}` }, { status: 502 });
}
