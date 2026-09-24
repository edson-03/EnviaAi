export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Enviaí</h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Seus convidados escaneiam o QR code e enviam as fotos do evento direto
        para o seu Google Drive.
      </p>
    </main>
  );
}
