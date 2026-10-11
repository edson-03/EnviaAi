"use client";

import QRCode from "qrcode";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  LIMITE_CIDADE,
  LIMITE_DESCRICAO,
  LIMITE_NOME,
  TIPOS_CHAVE,
  mascararChave,
  normalizarValor,
  validarPix,
  type DadosPix,
  type ErrosPix,
  type TipoChave,
} from "@/lib/pix";
import { MaterialPix, type ConfigMaterial } from "./material";

// Fica só neste navegador; a chave Pix nunca é enviada ao servidor.
const CHAVE_LOCAL = "enviai-caixinha";

const FORMATOS = {
  painel: { rotulo: "Painel de balcão", detalhe: "A5 em pé", pagina: "A5", largura: 148, altura: 209.5, copias: 1, escala: 148 / 210 },
  cartaz: { rotulo: "Cartaz", detalhe: "A4", pagina: "A4", largura: 210, altura: 296.5, copias: 1, escala: 1 },
  mesa: { rotulo: "Cartões de mesa", detalhe: "4 por folha A4, com linhas de corte", pagina: "A4", largura: 210, altura: 296.5, copias: 4, escala: 0.5 },
} as const;
type Formato = keyof typeof FORMATOS;

const FUNDOS = ["#ffffff", "#fdf6e9", "#f4f4f5", "#18181b", "#1e293b"];
const CORES = ["#7c3aed", "#db2777", "#dc2626", "#ea580c", "#b45309", "#059669", "#0d9488", "#2563eb", "#18181b"];

type Salvo = { dados?: DadosPix; config?: ConfigMaterial; formato?: Formato };

const configPadrao = (estabelecimento: string, cor: string): ConfigMaterial => ({
  titulo: "Pague com Pix",
  texto: "Aponte a câmera do app do seu banco para o QR code",
  estabelecimento,
  cor,
  fundo: "#ffffff",
  mostrarChave: true,
  mostrarValor: true,
  mostrarNome: true,
  tamanhoQr: 100,
});

async function criarQr(dados: DadosPix, payload: string) {
  const [svg, png] = await Promise.all([
    QRCode.toString(payload, { type: "svg", margin: 0, errorCorrectionLevel: "M" }),
    QRCode.toDataURL(payload, { width: 1200, margin: 4, errorCorrectionLevel: "M" }),
  ]);
  return { payload, svg: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, png, dados };
}

const nadaMuda = () => () => {};

// Lê o que ficou salvo neste navegador antes de montar o formulário (no servidor não há localStorage).
export function Caixinha(props: { titulo: string; cor: string }) {
  const salvo = useSyncExternalStore(
    nadaMuda,
    () => localStorage.getItem(CHAVE_LOCAL),
    () => undefined,
  );
  const inicial = useMemo<Salvo>(() => {
    try {
      return salvo ? JSON.parse(salvo) : {};
    } catch {
      return {};
    }
  }, [salvo]);
  if (salvo === undefined) return <p className="text-sm text-zinc-500">Carregando…</p>;
  return <EditorCaixinha {...props} inicial={inicial} />;
}

function EditorCaixinha({ titulo, cor, inicial }: { titulo: string; cor: string; inicial: Salvo }) {
  const [dados, setDados] = useState<DadosPix>(
    inicial.dados ?? { tipo: "cpf", chave: "", nome: "", cidade: "", valor: "", descricao: "" },
  );
  const [erros, setErros] = useState<ErrosPix>({});
  const [gerado, setGerado] = useState<{ payload: string; svg: string; png: string; dados: DadosPix }>();
  const [config, setConfig] = useState<ConfigMaterial>(inicial.config ?? configPadrao(titulo, cor));
  const [formato, setFormato] = useState<Formato>(inicial.formato && inicial.formato in FORMATOS ? inicial.formato : "painel");
  const [copiado, setCopiado] = useState(false);
  const [erroLogo, setErroLogo] = useState<string>();

  async function gerar() {
    const r = validarPix(dados);
    if ("erros" in r) return setErros(r.erros);
    setErros({});
    setGerado(await criarQr(dados, r.payload));
  }

  // Se já havia dados válidos salvos, mostra o QR direto.
  useEffect(() => {
    const r = inicial.dados && validarPix(inicial.dados);
    if (r && "payload" in r) criarQr(inicial.dados!, r.payload).then(setGerado);
  }, [inicial.dados]);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE_LOCAL, JSON.stringify({ dados, config, formato }));
    } catch {
      // Sem espaço (logo grande) ou navegação privada: segue sem salvar.
    }
  }, [dados, config, formato]);

  function mudar<K extends keyof DadosPix>(campo: K, valor: DadosPix[K]) {
    setDados((d) => ({ ...d, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  }

  const mudarConfig = (parcial: Partial<ConfigMaterial>) => setConfig((c) => ({ ...c, ...parcial }));

  async function copiar() {
    if (!gerado) return;
    await navigator.clipboard.writeText(gerado.payload);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  async function escolherLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setErroLogo(undefined);
    try {
      const bitmap = await createImageBitmap(arquivo);
      const escala = Math.min(1, 600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * escala);
      canvas.height = Math.round(bitmap.height * escala);
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      mudarConfig({ logo: canvas.toDataURL("image/png") });
    } catch {
      setErroLogo("Não foi possível usar esta imagem. Tente outra (PNG ou JPG).");
    }
  }

  const desatualizado = gerado && JSON.stringify(gerado.dados) !== JSON.stringify(dados);
  const tipo = TIPOS_CHAVE.find((t) => t.id === dados.tipo)!;
  const f = FORMATOS[formato];
  const valor = gerado && normalizarValor(gerado.dados.valor);
  const valorFormatado =
    valor && "valor" in valor && valor.valor
      ? Number(valor.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : undefined;

  return (
    <div className="flex flex-col gap-6 print:block">
      <style>{`@page { size: ${f.pagina}; margin: 0 }`}</style>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start print:hidden">
        <form
          className="cartao flex flex-col gap-4 p-5 sm:p-6"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            gerar();
          }}
        >
          <div>
            <h2 className="text-lg font-semibold">Caixinha Pix</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Gere um QR code Pix para receber contribuições no evento. Os dados ficam só neste navegador: nada é enviado ao
              Enviaí.
            </p>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo de chave</legend>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {TIPOS_CHAVE.map((t) => (
                <label
                  key={t.id}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet-500/40 ${
                    dados.tipo === t.id
                      ? "border-violet-600 bg-violet-50 font-medium text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                      : "border-zinc-300 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="tipo"
                    className="sr-only"
                    checked={dados.tipo === t.id}
                    onChange={() => {
                      mudar("tipo", t.id as TipoChave);
                      mudar("chave", mascararChave(t.id, dados.chave));
                    }}
                  />
                  {t.rotulo}
                </label>
              ))}
            </div>
          </fieldset>

          <Campo rotulo="Chave Pix" erro={erros.chave}>
            <input
              className="campo"
              value={dados.chave}
              onChange={(e) => mudar("chave", mascararChave(dados.tipo, e.target.value))}
              placeholder={tipo.exemplo}
              inputMode={dados.tipo === "cpf" || dados.tipo === "telefone" ? "numeric" : dados.tipo === "email" ? "email" : "text"}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={!!erros.chave}
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
            <Campo rotulo="Nome de quem recebe" dica={`Até ${LIMITE_NOME} caracteres`} erro={erros.nome}>
              <input
                className="campo"
                value={dados.nome}
                maxLength={LIMITE_NOME}
                onChange={(e) => mudar("nome", e.target.value)}
                autoComplete="name"
                aria-invalid={!!erros.nome}
              />
            </Campo>
            <Campo rotulo="Cidade" dica={`Até ${LIMITE_CIDADE} caracteres`} erro={erros.cidade}>
              <input
                className="campo"
                value={dados.cidade}
                maxLength={LIMITE_CIDADE}
                onChange={(e) => mudar("cidade", e.target.value)}
                autoComplete="address-level2"
                aria-invalid={!!erros.cidade}
              />
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
            <Campo rotulo="Valor (opcional)" dica="Vazio: quem paga escolhe" erro={erros.valor}>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">R$</span>
                <input
                  className="campo w-full pl-9"
                  value={dados.valor}
                  onChange={(e) => mudar("valor", e.target.value.replace(/[^\d.,]/g, ""))}
                  placeholder="0,00"
                  inputMode="decimal"
                  aria-invalid={!!erros.valor}
                />
              </div>
            </Campo>
            <Campo rotulo="Descrição (opcional)" dica="Aparece no app de quem paga, em alguns bancos" erro={erros.descricao}>
              <input
                className="campo"
                value={dados.descricao}
                maxLength={LIMITE_DESCRICAO}
                onChange={(e) => mudar("descricao", e.target.value)}
                placeholder="Ex.: Caixinha da festa"
                aria-invalid={!!erros.descricao}
              />
            </Campo>
          </div>

          {Object.values(erros).some(Boolean) && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              Corrija os campos marcados para gerar o QR code.
            </p>
          )}
          <div>
            <button className="btn-primario">{gerado ? "Atualizar QR Code" : "Gerar QR Code"}</button>
          </div>
        </form>

        <section className="cartao flex flex-col items-center gap-4 p-5 text-center" aria-live="polite">
          {gerado ? (
            <>
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- gerado no navegador */}
                <img
                  src={gerado.png}
                  alt="QR code Pix"
                  className={`h-56 w-56 rounded-lg border border-zinc-200 bg-white ${desatualizado ? "opacity-30" : ""}`}
                />
                {desatualizado && (
                  <p className="absolute inset-0 flex items-center justify-center p-6 text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    Você mudou os dados. Clique em “Atualizar QR Code”.
                  </p>
                )}
              </div>
              <div className="w-full text-left">
                <p className="text-xs font-medium text-zinc-500">Pix Copia e Cola</p>
                <p className="mt-1 max-h-24 overflow-auto break-all rounded-lg bg-zinc-100 px-3 py-2 font-mono text-xs dark:bg-zinc-800">
                  {gerado.payload}
                </p>
              </div>
              <div className="flex w-full flex-col gap-2">
                <button type="button" onClick={copiar} className="btn-primario">
                  {copiado ? "✓ Copiado!" : "Copiar código Pix"}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <a href={gerado.png} download="pix-qrcode.png" className="btn-secundario">
                    Baixar PNG
                  </a>
                  <a href={gerado.svg} download="pix-qrcode.svg" className="btn-secundario">
                    Baixar SVG
                  </a>
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                Teste antes de imprimir: pague R$ 0,01 com o app do seu banco e confira o nome que aparece. O Enviaí não
                confirma pagamentos.
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-sm text-zinc-500">
              <div className="grid h-40 w-40 place-items-center rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700">
                QR code
              </div>
              Preencha os dados e clique em “Gerar QR Code”.
            </div>
          )}
        </section>
      </div>

      {gerado && (
        <section className="flex flex-col gap-4 print:block">
          <div className="print:hidden">
            <h2 className="text-lg font-semibold">Material para imprimir</h2>
            <p className="mt-1 text-sm text-zinc-500">Escolha o modelo, edite e baixe em PDF.</p>
            <div className="mt-3 flex flex-wrap gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800 sm:inline-flex">
              {(Object.keys(FORMATOS) as Formato[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFormato(id)}
                  aria-pressed={formato === id}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                    formato === id ? "bg-white shadow-sm dark:bg-zinc-900" : "text-zinc-500"
                  }`}
                >
                  {FORMATOS[id].rotulo}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-500">{f.detalhe}</p>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start print:block">
            <div className="cartao flex flex-col gap-4 p-5 print:hidden">
              <Campo rotulo="Título">
                <input className="campo" value={config.titulo} maxLength={30} onChange={(e) => mudarConfig({ titulo: e.target.value })} />
              </Campo>
              <Campo rotulo="Texto de apoio">
                <textarea
                  className="campo resize-none"
                  rows={2}
                  value={config.texto}
                  maxLength={90}
                  onChange={(e) => mudarConfig({ texto: e.target.value })}
                />
              </Campo>
              <Campo rotulo="Nome do estabelecimento ou evento">
                <input
                  className="campo"
                  value={config.estabelecimento}
                  maxLength={40}
                  onChange={(e) => mudarConfig({ estabelecimento: e.target.value })}
                />
              </Campo>

              <div className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Logo
                <div className="flex flex-wrap items-center gap-2">
                  <label className="btn-secundario cursor-pointer">
                    {config.logo ? "Trocar imagem" : "Escolher imagem"}
                    <input type="file" accept="image/*" onChange={escolherLogo} className="sr-only" />
                  </label>
                  {config.logo && (
                    <button type="button" onClick={() => mudarConfig({ logo: undefined })} className="btn-secundario">
                      Remover
                    </button>
                  )}
                </div>
                {erroLogo && <p className="text-xs font-normal text-red-600">{erroLogo}</p>}
              </div>

              <Paleta rotulo="Cor principal" cores={CORES} valor={config.cor} mudar={(cor) => mudarConfig({ cor })} />
              <Paleta rotulo="Cor de fundo" cores={FUNDOS} valor={config.fundo} mudar={(fundo) => mudarConfig({ fundo })} />

              <fieldset className="flex flex-col gap-2 text-sm">
                <legend className="mb-1.5 font-medium text-zinc-700 dark:text-zinc-300">Mostrar no material</legend>
                <Opcao rotulo="Nome de quem recebe" marcado={config.mostrarNome} mudar={(v) => mudarConfig({ mostrarNome: v })} />
                <Opcao rotulo="Chave Pix" marcado={config.mostrarChave} mudar={(v) => mudarConfig({ mostrarChave: v })} />
                <Opcao
                  rotulo={valorFormatado ? "Valor" : "Valor (nenhum valor definido)"}
                  marcado={config.mostrarValor}
                  mudar={(v) => mudarConfig({ mostrarValor: v })}
                  desativado={!valorFormatado}
                />
              </fieldset>

              <label className="rotulo">
                Tamanho do QR code
                <input
                  type="range"
                  min={70}
                  max={120}
                  step={5}
                  value={config.tamanhoQr}
                  onChange={(e) => mudarConfig({ tamanhoQr: Number(e.target.value) })}
                  className="accent-violet-600"
                />
              </label>

              <button type="button" onClick={() => setConfig(configPadrao(titulo, cor))} className="btn-secundario">
                Restaurar modelo original
              </button>
            </div>

            <div className="flex flex-col gap-3 print:block">
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <button type="button" onClick={() => window.print()} className="btn-primario" disabled={desatualizado}>
                  Baixar PDF / Imprimir
                </button>
                <p className="text-xs text-zinc-500">
                  {desatualizado
                    ? "Atualize o QR code antes de baixar."
                    : `Na janela que abrir, escolha “Salvar como PDF”. Papel ${f.pagina}, sem margens, com “Gráficos de fundo” ligado.`}
                </p>
              </div>
              <Folha largura={f.largura} altura={f.altura}>
                {f.copias === 1 ? (
                  <MaterialPix config={config} info={info()} escala={f.escala} />
                ) : (
                  <div className="grid h-full w-full grid-cols-2 grid-rows-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="overflow-hidden border border-dashed border-zinc-400">
                        <MaterialPix config={config} info={info()} escala={f.escala} />
                      </div>
                    ))}
                  </div>
                )}
              </Folha>
            </div>
          </div>
        </section>
      )}
    </div>
  );

  function info() {
    const d = gerado!.dados;
    return {
      qr: gerado!.svg,
      chave: mascararChave(d.tipo, d.chave),
      rotuloChave: TIPOS_CHAVE.find((t) => t.id === d.tipo)!.rotulo.toLowerCase(),
      valor: valorFormatado,
      nome: d.nome.trim(),
    };
  }
}

// Folha no tamanho real (mm). Na tela encolhe para caber na coluna; na impressão sai em 100%.
function Folha({ largura, altura, children }: { largura: number; altura: number; children: React.ReactNode }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  const px = (mm: number) => (mm * 96) / 25.4;

  useLayoutEffect(() => {
    const el = caixa.current!;
    const medir = () => setEscala(Math.min(1, el.clientWidth / px(largura)));
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, [largura]);

  return (
    <div ref={caixa} className="w-full overflow-hidden print:h-auto! print:overflow-visible" style={{ height: px(altura) * escala }}>
      <div
        className="origin-top-left overflow-hidden shadow-xl ring-1 ring-zinc-200 print:transform-none! print:shadow-none print:ring-0 dark:ring-zinc-800"
        style={{
          width: `${largura}mm`,
          height: `${altura}mm`,
          transform: `scale(${escala})`,
          printColorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Campo({ rotulo, dica, erro, children }: { rotulo: string; dica?: string; erro?: string; children: React.ReactNode }) {
  return (
    <label className="rotulo">
      {rotulo}
      {children}
      {erro ? (
        <span className="text-xs font-normal text-red-600">{erro}</span>
      ) : (
        dica && <span className="text-xs font-normal text-zinc-500">{dica}</span>
      )}
    </label>
  );
}

function Paleta({ rotulo, cores, valor, mudar }: { rotulo: string; cores: string[]; valor: string; mudar: (cor: string) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{rotulo}</legend>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {cores.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => mudar(c)}
            aria-label={c}
            aria-pressed={valor.toLowerCase() === c}
            className={`h-8 w-8 rounded-full border border-zinc-300 ring-offset-2 ring-offset-white transition hover:scale-110 dark:border-zinc-600 dark:ring-offset-zinc-900 ${
              valor.toLowerCase() === c ? "ring-2 ring-zinc-900 dark:ring-white" : ""
            }`}
            style={{ background: c }}
          />
        ))}
        <label className="relative h-8 w-8 cursor-pointer overflow-hidden rounded-full border border-zinc-300 bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] dark:border-zinc-600" title="Outra cor">
          <input type="color" value={valor} onChange={(e) => mudar(e.target.value)} className="absolute inset-0 opacity-0" aria-label={`${rotulo}: outra cor`} />
        </label>
      </div>
    </fieldset>
  );
}

function Opcao({ rotulo, marcado, mudar, desativado }: { rotulo: string; marcado: boolean; mudar: (v: boolean) => void; desativado?: boolean }) {
  return (
    <label className={`flex items-center gap-2 ${desativado ? "text-zinc-400" : ""}`}>
      <input type="checkbox" checked={marcado} disabled={desativado} onChange={(e) => mudar(e.target.checked)} className="h-4 w-4 accent-violet-600" />
      {rotulo}
    </label>
  );
}
