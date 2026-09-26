// Cria coleções, validação de schema e índices. Idempotente.
// Uso: npm run db:setup  (lê MONGODB_URI e MONGODB_DB do .env.local)
import { MongoClient, type Db, type Document } from "mongodb";

const colecoes: Record<string, { schema: Document; indices: [Document, Document?][] }> = {
  albums: {
    schema: {
      bsonType: "object",
      required: ["ownerId", "slug", "titulo", "driveFolderId", "corTema", "galeriaPublica", "ativo", "createdAt"],
      properties: {
        ownerId: { bsonType: "objectId" },
        slug: { bsonType: "string", pattern: "^[a-z0-9]+(-[a-z0-9]+)*$", maxLength: 80 },
        titulo: { bsonType: "string", minLength: 1, maxLength: 120 },
        tipoEvento: { bsonType: "string" },
        dataEvento: { bsonType: "date" },
        driveFolderId: { bsonType: "string" },
        capaUrl: { bsonType: "string" },
        capaDriveFileId: { bsonType: "string" },
        corTema: { bsonType: "string", pattern: "^#[0-9a-fA-F]{6}$" },
        mensagemBoasVindas: { bsonType: "string", maxLength: 500 },
        galeriaPublica: { bsonType: "bool" },
        ativo: { bsonType: "bool" },
        suspenso: { bsonType: "bool" },
        telaoToken: { bsonType: "string", minLength: 20 },
        ultimoResumoEm: { bsonType: "date" },
        planoContratado: {
          bsonType: "object",
          required: ["_id", "nome", "precoCentavos", "limiteArquivos", "maxBytesArquivo", "telao", "personalizacao"],
        },
        planoDesde: { bsonType: "date" },
        planoExpiraEm: { bsonType: "date" },
        planoPagamentoId: { bsonType: "string" },
        createdAt: { bsonType: "date" },
      },
    },
    indices: [
      [{ slug: 1 }, { unique: true }],
      [{ telaoToken: 1 }, { unique: true, sparse: true }],
      [{ ownerId: 1, createdAt: -1 }],
    ],
  },
  uploads: {
    schema: {
      bsonType: "object",
      required: ["albumId", "driveFileId", "nomeArquivo", "mimeType", "tamanhoBytes", "aprovado", "createdAt"],
      properties: {
        albumId: { bsonType: "objectId" },
        driveFileId: { bsonType: "string" },
        nomeArquivo: { bsonType: "string" },
        mimeType: { bsonType: "string", pattern: "^(image|video)/" },
        tamanhoBytes: { bsonType: ["int", "long", "double"], minimum: 0 },
        nomeConvidado: { bsonType: "string", maxLength: 80 },
        legenda: { bsonType: "string", maxLength: 500 },
        aprovado: { bsonType: "bool" },
        createdAt: { bsonType: "date" },
      },
    },
    indices: [
      [{ driveFileId: 1 }, { unique: true }],
      [{ albumId: 1, createdAt: -1 }],
    ],
  },
  pagamentos: {
    schema: {
      bsonType: "object",
      required: ["albumId", "ownerId", "mpPaymentId", "status", "valorCentavos", "createdAt", "atualizadoEm"],
      properties: {
        albumId: { bsonType: "objectId" },
        ownerId: { bsonType: "objectId" },
        planoId: { bsonType: "string" },
        mpPaymentId: { bsonType: "string" },
        status: { bsonType: "string" },
        valorCentavos: { bsonType: ["int", "long", "double"], minimum: 0 },
        metodo: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        atualizadoEm: { bsonType: "date" },
      },
    },
    indices: [
      [{ mpPaymentId: 1 }, { unique: true }],
      [{ ownerId: 1, createdAt: -1 }],
    ],
  },
  planos: {
    schema: {
      bsonType: "object",
      required: [
        "_id", "nome", "tipo", "precoCentavos", "limiteArquivos", "maxBytesArquivo", "telao", "personalizacao",
        "validadeDias", "ativo", "ordem", "createdAt", "atualizadoEm",
      ],
      properties: {
        _id: { bsonType: "string", pattern: "^[a-z0-9-]{2,40}$" },
        nome: { bsonType: "string", minLength: 1, maxLength: 60 },
        tipo: { enum: ["gratis", "pago"] },
        precoCentavos: { bsonType: ["int", "long", "double"], minimum: 0 },
        limiteArquivos: { bsonType: ["int", "long", "double"], minimum: 1 },
        maxBytesArquivo: { bsonType: ["int", "long", "double"], minimum: 1 },
        telao: { bsonType: "bool" },
        personalizacao: { bsonType: "bool" },
        validadeDias: { bsonType: ["int", "long", "double", "null"] },
        albunsAtivos: { bsonType: ["int", "long", "double"], minimum: 1 },
        ativo: { bsonType: "bool" },
        ordem: { bsonType: ["int", "long", "double"] },
        createdAt: { bsonType: "date" },
        atualizadoEm: { bsonType: "date" },
      },
    },
    indices: [[{ ordem: 1 }]],
  },
  rateLimits: {
    schema: {
      bsonType: "object",
      required: ["_id", "count", "expiresAt"],
      properties: {
        _id: { bsonType: "string" },
        count: { bsonType: ["int", "long", "double"], minimum: 0 },
        expiresAt: { bsonType: "date" },
      },
    },
    indices: [[{ expiresAt: 1 }, { expireAfterSeconds: 0 }]],
  },
};

async function setupDb(db: Db) {
  const existentes = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name));

  for (const [nome, { schema, indices }] of Object.entries(colecoes)) {
    const validator = { $jsonSchema: schema };
    if (existentes.has(nome)) {
      await db.command({ collMod: nome, validator, validationLevel: "strict" });
    } else {
      await db.createCollection(nome, { validator, validationLevel: "strict" });
    }
    for (const [chave, opcoes] of indices) {
      await db.collection(nome).createIndex(chave, opcoes);
    }
    console.log(`ok: ${nome}`);
  }
  await dadosIniciais(db);
}

// Planos iniciais (se ainda não existirem) e migração do antigo "premium: true" para planoContratado.
async function dadosIniciais(db: Db) {
  const GB = 1024 ** 3;
  const agora = new Date();
  const premium = {
    _id: "premium", nome: "Premium", tipo: "pago", precoCentavos: 2990, limiteArquivos: 5000, maxBytesArquivo: 4 * GB,
    telao: true, personalizacao: true, validadeDias: null, ativo: true, ordem: 1,
  };
  const iniciais = [
    {
      _id: "gratis", nome: "Grátis", tipo: "gratis", precoCentavos: 0, limiteArquivos: 200, maxBytesArquivo: 4 * GB,
      telao: false, personalizacao: false, validadeDias: null, albunsAtivos: 1, ativo: true, ordem: 0,
    },
    premium,
  ];
  for (const p of iniciais) {
    await db.collection("planos").updateOne({ _id: p._id as never }, { $setOnInsert: { ...p, createdAt: agora, atualizadoEm: agora } }, { upsert: true });
  }
  console.log("ok: planos iniciais");

  const { _id, nome, precoCentavos, limiteArquivos, maxBytesArquivo, telao, personalizacao, validadeDias } = premium;
  const migrados = await db.collection("albums").updateMany({ premium: true, planoContratado: { $exists: false } }, [
    {
      $set: {
        planoContratado: { _id, nome, precoCentavos, limiteArquivos, maxBytesArquivo, telao, personalizacao, validadeDias },
        planoDesde: { $ifNull: ["$premiumDesde", agora] },
      },
    },
    { $unset: ["premium", "premiumDesde"] },
  ]);
  console.log(`ok: ${migrados.modifiedCount} álbum(ns) premium migrado(s)`);
}

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI não definida");
const client = new MongoClient(uri);
try {
  await setupDb(client.db(process.env.MONGODB_DB ?? "enviai"));
} finally {
  await client.close();
}
