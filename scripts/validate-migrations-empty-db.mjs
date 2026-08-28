import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import mysql from "mysql2/promise";

const sourceUrl = process.env.DATABASE_URL;
if (!sourceUrl) throw new Error("DATABASE_URL ausente; não é possível validar migrations em banco vazio.");

const connectionUrl = new URL(sourceUrl);
const temporaryDatabase = `raizon_migration_validation_${Date.now()}`;
connectionUrl.pathname = "/";
const connection = await mysql.createConnection(connectionUrl.toString());

try {
  await connection.query(`CREATE DATABASE \`${temporaryDatabase}\``);
  await connection.query(`USE \`${temporaryDatabase}\``);
  const migrationDirectory = join(process.cwd(), "drizzle");
  const migrations = (await readdir(migrationDirectory))
    .filter((filename) => /^\d{4}_.+\.sql$/.test(filename))
    .sort();

  for (const migration of migrations) {
    const source = await readFile(join(migrationDirectory, migration), "utf8");
    const statements = source.split("--> statement-breakpoint").map((statement) => statement.trim()).filter(Boolean);
    for (const statement of statements) await connection.query(statement);
  }

  const [tables] = await connection.query("SELECT COUNT(*) AS tableCount FROM information_schema.tables WHERE table_schema = ?", [temporaryDatabase]);
  const [auditTable] = await connection.query("SELECT COUNT(*) AS columnCount FROM information_schema.columns WHERE table_schema = ? AND table_name = 'audit_events'", [temporaryDatabase]);
  if (Number(tables[0]?.tableCount) < 26) throw new Error("Schema temporário incompleto após migrations.");
  if (Number(auditTable[0]?.columnCount) !== 11) throw new Error("Tabela audit_events não corresponde ao schema esperado.");
  console.log(JSON.stringify({ ok: true, migrationsApplied: migrations.length, tableCount: Number(tables[0]?.tableCount), auditEventColumns: Number(auditTable[0]?.columnCount) }));
} finally {
  await connection.query(`DROP DATABASE IF EXISTS \`${temporaryDatabase}\``).catch(() => undefined);
  await connection.end();
}
