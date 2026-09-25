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
}

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI não definida");
const client = new MongoClient(uri);
try {
  await setupDb(client.db(process.env.MONGODB_DB ?? "enviai"));
} finally {
  await client.close();
}
