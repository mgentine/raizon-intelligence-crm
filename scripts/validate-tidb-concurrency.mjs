import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import mysql from "mysql2/promise";

const sourceUrl = process.env.DATABASE_URL;
if (!sourceUrl) throw new Error("DATABASE_URL ausente; não é possível validar concorrência.");

const rootUrl = new URL(sourceUrl);
rootUrl.pathname = "/";
const temporaryDatabase = `raizon_concurrency_validation_${Date.now()}`;
const admin = await mysql.createConnection(rootUrl.toString());
const connectToTemporaryDatabase = async () => {
  const url = new URL(sourceUrl);
  url.pathname = `/${temporaryDatabase}`;
  return mysql.createConnection(url.toString());
};
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function applyMigrations(connection) {
  const migrationDirectory = join(process.cwd(), "drizzle");
  const migrations = (await readdir(migrationDirectory)).filter((filename) => /^\d{4}_.+\.sql$/.test(filename)).sort();
  for (const migration of migrations) {
    const source = await readFile(join(migrationDirectory, migration), "utf8");
    for (const statement of source.split("--> statement-breakpoint").map((item) => item.trim()).filter(Boolean)) await connection.query(statement);
  }
  return migrations.length;
}

async function expectConcurrentDuplicate(primary, competing, sql, params) {
  await primary.beginTransaction();
  await primary.execute(sql, params);
  const competingWrite = competing.execute(sql, params).then(() => null).catch((error) => error);
  await sleep(200);
  await primary.commit();
  const error = await competingWrite;
  if (!error || !String(error.code || error.message).match(/DUP|duplicate|write conflict/i)) throw new Error("Constraint concorrente não bloqueou a segunda gravação como esperado.");
  return String(error.code || error.message);
}

try {
  await admin.query(`CREATE DATABASE \`${temporaryDatabase}\``);
  await admin.query(`USE \`${temporaryDatabase}\``);
  const migrationsApplied = await applyMigrations(admin);
  const primary = await connectToTemporaryDatabase();
  const competing = await connectToTemporaryDatabase();
  try {
    await primary.execute("INSERT INTO companies (cnpj, legalName, source, confidenceLevel) VALUES (?, ?, 'test', 'high')", ["00000000000191", "Empresa de validação concorrente"]);
    await primary.execute("INSERT INTO service_catalog (name, category, scope, deliverables) VALUES ('Serviço de validação', 'teste', 'Escopo técnico de validação', 'Entregável de validação')");
    await primary.execute("INSERT INTO opportunities (companyId, title, serviceType, stage) VALUES (1, 'Oportunidade de validação', 'Teste físico', 'proposal')");
    await primary.execute("INSERT INTO proposal_sequences (year, nextNumber) VALUES (2099, 1)");

    await primary.beginTransaction();
    await primary.execute("SELECT nextNumber FROM proposal_sequences WHERE year = 2099 FOR UPDATE");
    const startedAt = Date.now();
    const competingLock = (async () => { await competing.beginTransaction(); await competing.execute("SELECT nextNumber FROM proposal_sequences WHERE year = 2099 FOR UPDATE"); await competing.execute("UPDATE proposal_sequences SET nextNumber = nextNumber + 1 WHERE year = 2099"); await competing.commit(); return Date.now() - startedAt; })();
    await sleep(200);
    await primary.execute("UPDATE proposal_sequences SET nextNumber = nextNumber + 1 WHERE year = 2099");
    await primary.commit();
    const lockWaitMs = await competingLock;
    const [[sequence]] = await primary.query("SELECT nextNumber FROM proposal_sequences WHERE year = 2099");
    if (Number(sequence.nextNumber) !== 3 || lockWaitMs < 150) throw new Error("Lock pessimista não serializou a sequência anual no TiDB temporário.");

    const proposalSql = "INSERT INTO proposals (seriesKey, version, proposalNumber, opportunityId, companyId, serviceId, status, documentStatus, decisionStatus, clientSnapshot, serviceSnapshot, scopeSnapshot, deliverablesSnapshot, investment, validityDays, visitsIncluded) VALUES (?, 1, ?, 1, 1, 1, 'draft', 'draft', 'pending', '{}', '{}', 'Escopo', 'Entregáveis', '100.00', 20, 0)";
    const proposalDuplicate = await expectConcurrentDuplicate(primary, competing, proposalSql, ["concurrency-proposal", "T-2099/001"]);
    const [[proposal]] = await primary.query("SELECT id FROM proposals WHERE seriesKey = 'concurrency-proposal' AND version = 1");
    const projectSql = "INSERT INTO execution_projects (proposalId, opportunityId, companyId, title, status, phase, activationBasis, scopeSnapshot, deliverablesSnapshot) VALUES (?, 1, 1, 'Projeto concorrente', 'planning', 'planning', 'customer_acceptance', 'Escopo', 'Entregáveis')";
    const projectDuplicate = await expectConcurrentDuplicate(primary, competing, projectSql, [proposal.id]);
    const [[projectCount]] = await primary.query("SELECT COUNT(*) AS total FROM execution_projects WHERE proposalId = ?", [proposal.id]);
    if (Number(projectCount.total) !== 1) throw new Error("UNIQUE de projeto por proposta falhou na concorrência física.");

    console.log(JSON.stringify({ ok: true, migrationsApplied, lockWaitMs, finalSequence: Number(sequence.nextNumber), proposalDuplicate, projectDuplicate, projectCount: Number(projectCount.total) }));
  } finally {
    await primary.end().catch(() => undefined);
    await competing.end().catch(() => undefined);
  }
} finally {
  await admin.query(`DROP DATABASE IF EXISTS \`${temporaryDatabase}\``).catch(() => undefined);
  await admin.end();
}
