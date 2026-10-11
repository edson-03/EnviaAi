// Pix estático no padrão BR Code (EMV-QRCPS) do Banco Central. Roda no navegador: a chave não sai do aparelho.

export type TipoChave = "cpf" | "cnpj" | "email" | "telefone" | "aleatoria";

export const TIPOS_CHAVE: { id: TipoChave; rotulo: string; exemplo: string }[] = [
  { id: "cpf", rotulo: "CPF", exemplo: "000.000.000-00" },
  { id: "cnpj", rotulo: "CNPJ", exemplo: "00.000.000/0000-00" },
  { id: "email", rotulo: "E-mail", exemplo: "voce@email.com" },
  { id: "telefone", rotulo: "Telefone", exemplo: "(11) 98765-4321" },
  { id: "aleatoria", rotulo: "Chave aleatória", exemplo: "123e4567-e89b-12d3-a456-426614174000" },
];

export type DadosPix = {
  tipo: TipoChave;
  chave: string;
  nome: string;
  cidade: string;
  valor: string; // como digitado: "25", "25,50", "1.250,00"
  descricao: string;
};

export const LIMITE_NOME = 25;
export const LIMITE_CIDADE = 15;
export const LIMITE_DESCRICAO = 40;

const soDigitos = (s: string) => s.replace(/\D/g, "");

// Remove acentos e caracteres fora do ASCII imprimível (o payload conta tamanho em caracteres).
export function semAcentos(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Máscara aplicada enquanto a pessoa digita.
export function mascararChave(tipo: TipoChave, valor: string) {
  if (tipo === "cpf") {
    const d = soDigitos(valor).slice(0, 11);
    return d.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1-$2");
  }
  if (tipo === "cnpj") {
    // CNPJ alfanumérico (a partir de 2026): 12 letras/números + 2 dígitos verificadores.
    const d = valor.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 14);
    return d
      .replace(/^(\w{2})(\w)/, "$1.$2")
      .replace(/^(\w{2})\.(\w{3})(\w)/, "$1.$2.$3")
      .replace(/\.(\w{3})(\w)/, ".$1/$2")
      .replace(/(\w{4})(\w)/, "$1-$2");
  }
  if (tipo === "telefone") {
    const d = soDigitos(valor).replace(/^55(?=\d{10,11}$)/, "").slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    const corte = d.length === 11 ? 7 : 6;
    return `(${d.slice(0, 2)}) ${d.slice(2, corte)}-${d.slice(corte)}`;
  }
  return valor.trim();
}

function cpfValido(d: string) {
  if (!/^\d{11}$/.test(d) || /^(\d)\1+$/.test(d)) return false;
  const dv = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

function cnpjValido(c: string) {
  if (!/^[0-9A-Z]{12}\d{2}$/.test(c) || /^(\w)\1+$/.test(c)) return false;
  const valor = (ch: string) => ch.charCodeAt(0) - 48; // regra da Receita: "0"=0 ... "A"=17
  const dv = (n: number) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = pesos.reduce((t, p, i) => t + valor(c[i]) * p, 0);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(12) === Number(c[12]) && dv(13) === Number(c[13]);
}

// Chave no formato que vai no payload, ou mensagem de erro.
export function normalizarChave(tipo: TipoChave, chave: string): { chave: string } | { erro: string } {
  const bruta = chave.trim();
  if (!bruta) return { erro: "Informe a chave Pix." };
  switch (tipo) {
    case "cpf": {
      const d = soDigitos(bruta);
      return cpfValido(d) ? { chave: d } : { erro: "CPF inválido. Confira os 11 números." };
    }
    case "cnpj": {
      const c = bruta.toUpperCase().replace(/[^0-9A-Z]/g, "");
      return cnpjValido(c) ? { chave: c } : { erro: "CNPJ inválido. Confira os números." };
    }
    case "email": {
      const e = bruta.toLowerCase();
      return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(e) && e.length <= 77
        ? { chave: e }
        : { erro: "E-mail inválido. Exemplo: voce@email.com" };
    }
    case "telefone": {
      const d = soDigitos(bruta).replace(/^55(?=\d{10,11}$)/, "");
      return /^[1-9]{2}9?\d{8}$/.test(d) ? { chave: `+55${d}` } : { erro: "Telefone inválido. Use DDD + número, ex.: (11) 98765-4321." };
    }
    case "aleatoria": {
      const a = bruta.toLowerCase();
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(a)
        ? { chave: a }
        : { erro: "Chave aleatória inválida. Ela tem 36 caracteres, como 123e4567-e89b-12d3-a456-426614174000." };
    }
  }
}

// "1.250,50" -> "1250.50". Vazio = quem paga digita o valor.
export function normalizarValor(valor: string): { valor?: string } | { erro: string } {
  const v = valor.trim().replace(/^R\$\s*/i, "");
  if (!v) return {};
  if (!/^\d{1,3}(\.\d{3})*(,\d{1,2})?$|^\d+(,\d{1,2})?$/.test(v)) return { erro: "Valor inválido. Exemplo: 25,00" };
  const n = Number(v.replace(/\./g, "").replace(",", "."));
  if (n <= 0) return { erro: "O valor precisa ser maior que zero." };
  if (n > 999_999_999.99) return { erro: "Valor alto demais." };
  return { valor: n.toFixed(2) };
}

export type ErrosPix = Partial<Record<"chave" | "nome" | "cidade" | "valor" | "descricao", string>>;

export function validarPix(d: DadosPix): { payload: string } | { erros: ErrosPix } {
  const erros: ErrosPix = {};
  const chave = normalizarChave(d.tipo, d.chave);
  if ("erro" in chave) erros.chave = chave.erro;

  const nome = semAcentos(d.nome);
  if (!nome) erros.nome = "Informe o nome de quem recebe.";
  else if (nome.length > LIMITE_NOME) erros.nome = `Use até ${LIMITE_NOME} caracteres.`;

  const cidade = semAcentos(d.cidade);
  if (!cidade) erros.cidade = "Informe a cidade.";
  else if (cidade.length > LIMITE_CIDADE) erros.cidade = `Use até ${LIMITE_CIDADE} caracteres (abrevie se precisar).`;

  const valor = normalizarValor(d.valor);
  if ("erro" in valor) erros.valor = valor.erro;

  const descricao = semAcentos(d.descricao);
  if (descricao.length > LIMITE_DESCRICAO) erros.descricao = `Use até ${LIMITE_DESCRICAO} caracteres.`;

  if (Object.keys(erros).length || "erro" in chave || "erro" in valor) return { erros };

  // O campo 26 (conta) tem no máximo 99 caracteres; a descrição divide espaço com a chave.
  const espaco = 99 - 18 - (4 + chave.chave.length) - 4;
  if (descricao && descricao.length > espaco) return { erros: { descricao: `Com esta chave, a descrição cabe em até ${Math.max(espaco, 0)} caracteres.` } };

  return { payload: montarPayload({ chave: chave.chave, nome, cidade, valor: valor.valor, descricao }) };
}

const campo = (id: string, valor: string) => id + String(valor.length).padStart(2, "0") + valor;

// CRC16-CCITT (polinômio 0x1021, início 0xFFFF), exigido no campo 63.
export function crc16(texto: string) {
  let crc = 0xffff;
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function montarPayload(p: { chave: string; nome: string; cidade: string; valor?: string; descricao?: string }) {
  const conta = campo("00", "br.gov.bcb.pix") + campo("01", p.chave) + (p.descricao ? campo("02", p.descricao) : "");
  const semCrc =
    campo("00", "01") +
    campo("26", conta) +
    campo("52", "0000") +
    campo("53", "986") +
    (p.valor ? campo("54", p.valor) : "") +
    campo("58", "BR") +
    campo("59", p.nome) +
    campo("60", p.cidade) +
    campo("62", campo("05", "***")) +
    "6304";
  return semCrc + crc16(semCrc);
}
