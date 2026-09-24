import { Logo } from "@/components/logo";
import { BotaoSair } from "./dashboard/botao-sair";

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fundo-painel flex flex-col">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3">
          <Logo href="/dashboard" />
          <BotaoSair />
        </div>
      </header>
      {children}
    </div>
  );
}
