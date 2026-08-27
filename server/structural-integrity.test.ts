import { readFileSync } from "node:fs";
import { getTableConfig } from "drizzle-orm/mysql-core";
import { describe, expect, it } from "vitest";
import { executionProjects, projectChecklist, projectEvidence, projectTasks, proposals } from "../drizzle/schema";

function constraintNames(table: Parameters<typeof getTableConfig>[0]) {
  const config = getTableConfig(table);
  return {
    foreignKeys: config.foreignKeys.map((constraint) => constraint.getName()),
    uniqueIndexes: config.indexes.filter((index) => index.config.unique).map((index) => index.config.name),
  };
}

function functionBody(source: string, name: string, nextName: string) {
  const start = source.indexOf(`export async function ${name}`);
  const end = source.indexOf(`export async function ${nextName}`, start);
  if (start < 0 || end < 0) throw new Error(`Função ${name} não encontrada no contrato estrutural.`);
  return source.slice(start, end);
}

describe("contratos estruturais P0", () => {
  it("declara unicidade de uma execução por proposta e de versões por série", () => {
    expect(constraintNames(executionProjects).uniqueIndexes).toContain("execution_projects_proposal_unique");
    expect(constraintNames(proposals).uniqueIndexes).toContain("proposals_series_version_unique");
  });

  it("declara FKs restritivas para o agregado proposta-execução", () => {
    expect(constraintNames(proposals).foreignKeys).toEqual(expect.arrayContaining([
      "proposals_company_fk", "proposals_opportunity_fk", "proposals_service_fk",
    ]));
    expect(constraintNames(executionProjects).foreignKeys).toEqual(expect.arrayContaining([
      "execution_projects_proposal_fk", "execution_projects_opportunity_fk", "execution_projects_company_fk",
    ]));
    expect(constraintNames(projectTasks).foreignKeys).toContain("project_tasks_project_fk");
    expect(constraintNames(projectChecklist).foreignKeys).toContain("project_checklist_project_fk");
    expect(constraintNames(projectEvidence).foreignKeys).toEqual(expect.arrayContaining([
      "project_evidence_project_fk", "project_evidence_task_fk",
    ]));
  });

  it("mantém criação de execução, checklist e bloqueio da proposta na mesma transação", () => {
    const source = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
    const body = functionBody(source, "createExecutionProjectFromProposal", "updateExecutionProjectStatus");

    expect(body).toContain("withTransactionRetry");
    expect(body).toContain("db.transaction");
    expect(body).toContain('.for("update")');
    expect(body).toContain("tx.insert(projectChecklist)");
    expect(body).toContain("isDuplicateKeyError");
  });

  it("mantém bloqueios transacionais para criação, versão e emissão de propostas", () => {
    const source = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
    const createBody = functionBody(source, "createProposalFromRefs", "updateProposalDetails");
    const versionBody = functionBody(source, "createProposalVersion", "issueProposal");
    const issueBody = functionBody(source, "issueProposal", "listExecutionProjects");

    expect(createBody).toContain('.for("update")');
    expect(versionBody).toContain('.for("update")');
    expect(versionBody).toContain("orderBy(desc(proposals.version))");
    expect(issueBody).toContain('.for("update")');
    expect(issueBody).toContain("proposalSequences.nextNumber");
  });

  it("impede evidência vinculada a tarefa de outro projeto no contrato de persistência", () => {
    const source = readFileSync(new URL("./db.ts", import.meta.url), "utf8");
    const body = functionBody(source, "createProjectEvidence", "updateProjectChecklistStatus");

    expect(body).toContain("eq(projectTasks.projectId, input.projectId)");
    expect(body).toContain("A tarefa informada não pertence ao projeto de execução.");
    expect(body).toContain("db.transaction");
  });
});
