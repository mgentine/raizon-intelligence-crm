import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { and, eq } from "drizzle-orm";
import { getDb, withTransactionRetry } from "../server/db.ts";
import {
  activities,
  companies,
  executionProjects,
  opportunities,
  projectEvidence,
  projectTasks,
  proposals,
  serviceCatalog,
} from "../drizzle/schema.ts";
import { storagePut } from "../server/storage.ts";

const OWNER_ID = 1;
const CASE_KEY = "historico-guzolandia-contrato-006-2026";
const COMPANY_CNPJ = "45746112000124";
const PROPOSAL_SERIES = `historical:${CASE_KEY}`;
const OPPORTUNITY_TITLE = "Contrato nº 006/2026 — PMGIRS e instrumentos correlatos — Guzolândia/SP";
const PROJECT_TITLE = "Execução histórica — Contrato nº 006/2026 — Guzolândia/SP";
const SOURCE_DIR = "/home/ubuntu/upload";
const documents = [
  {
    title: "Contrato nº 006/2026 — Município de Guzolândia/SP",
    filename: "CONTRATO.pdf",
    storageName: "contrato-006-2026.pdf",
    sourcePath: `${SOURCE_DIR}/CONTRATO.pdf`,
  },
  {
    title: "Relatório técnico de execução e medição nº 01 — Município de Guzolândia/SP",
    filename: "001_RelatórioTécnico-Medição01-PMGuzolandia.pdf",
    storageName: "relatorio-tecnico-medicao-01-pm-guzolandia.pdf",
    sourcePath: `${SOURCE_DIR}/001_RelatórioTécnico-Medição01-PMGuzolandia.pdf`,
  },
];

function civilDateAtNoonBrt(value) {
  return new Date(`${value}T12:00:00-03:00`);
}

function sourceNote(documentHashes) {
  return JSON.stringify({
    origin: "cadastro_historico_autorizado",
    caseKey: CASE_KEY,
    documents: documentHashes,
    statement:
      "Dados registrados exclusivamente a partir de contrato e relatórios encaminhados pelo responsável do CRM em 27/08/2026. Sem presunção de atesto, aceite final, pagamento, encerramento ou aprovação final da contratante.",
  });
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  const [existingProposal] = await db
    .select({ id: proposals.id })
    .from(proposals)
    .where(eq(proposals.seriesKey, PROPOSAL_SERIES))
    .limit(1);

  if (existingProposal) {
    const [existingProject] = await db
      .select({ id: executionProjects.id })
      .from(executionProjects)
      .where(eq(executionProjects.proposalId, existingProposal.id))
      .limit(1);
    if (!existingProject) {
      throw new Error("Cadastro histórico parcialmente existente: proposta encontrada sem projeto. A operação foi interrompida sem upload adicional.");
    }
    console.log(JSON.stringify({ alreadyApplied: true, proposalId: existingProposal.id, projectId: existingProject.id }));
    return;
  }

  const uploadedDocuments = [];
  for (const document of documents) {
    const content = await readFile(document.sourcePath);
    const sha256 = createHash("sha256").update(content).digest("hex");
    const uploaded = await storagePut(
      `historicos/guzolandia/contrato-006-2026/${document.storageName}`,
      content,
      "application/pdf",
    );
    uploadedDocuments.push({ ...document, ...uploaded, sha256, bytes: content.byteLength });
  }

  const ids = await withTransactionRetry(() =>
    db.transaction(async (tx) => {
      let [company] = await tx
        .select()
        .from(companies)
        .where(eq(companies.cnpj, COMPANY_CNPJ))
        .limit(1)
        .for("update");
      if (!company) {
        const inserted = await tx
          .insert(companies)
          .values({
            cnpj: COMPANY_CNPJ,
            legalName: "Município de Guzolândia",
            tradeName: "Prefeitura Municipal de Guzolândia",
            registrationStatus: "Não verificado nesta homologação documental",
            relationshipStatus: "prospect",
            operationalStatus: "active",
            address: "Avenida Paschoal Guzzo",
            addressNumber: "1065",
            postalCode: "15355-033",
            city: "Guzolândia",
            state: "SP",
            source: "contrato_006_2026_guzolandia",
            confidenceLevel: "high",
            notes:
              "Cadastro histórico autorizado a partir do Contrato nº 006/2026. A condição comercial é derivada do contrato/projeto; não registrar pagamento, aceite final ou encerramento sem evidência específica.",
          })
          .$returningId();
        const companyId = Number(inserted[0]?.id);
        [company] = await tx.select().from(companies).where(eq(companies.id, companyId)).limit(1);
      }
      if (!company) throw new Error("Não foi possível obter a empresa histórica criada.");

      let [service] = await tx
        .select()
        .from(serviceCatalog)
        .where(eq(serviceCatalog.historicalSourceKey, CASE_KEY))
        .limit(1)
        .for("update");
      if (!service) {
        const inserted = await tx
          .insert(serviceCatalog)
          .values({
            name: "Contrato histórico nº 006/2026 — PMGIRS e instrumentos correlatos",
            category: "Gestão pública e resíduos",
            summary: "Registro histórico do objeto contratado pelo Município de Guzolândia/SP, conforme Contrato nº 006/2026.",
            scope:
              "PMGIRS; Plano de Educação Ambiental; Plano de Contingência (Diretrizes Defesa Civil); PGRS RCC; PGRS de resíduos volumosos; respostas técnicas a TRCA CETESB; renovação de LO do aterro municipal; visita técnica e deslocamento, conforme itens do Contrato nº 006/2026.",
            deliverables:
              "Entregas e execuções documentadas no Relatório Técnico de Execução e Medição nº 01: respostas técnicas CETESB, instrução da renovação de LO, visita técnica, deslocamento e PLANCON Fase 1. O escopo remanescente não é presumido como entregue.",
            assumptions:
              "Registro histórico com base nos PDFs encaminhados em 27/08/2026; não substitui verificação jurídica de assinaturas, atesto, pagamento ou encerramento.",
            exclusions:
              "Não registra aceite final, pagamento, encerramento contratual ou aprovação administrativa sem evidência documental específica.",
            defaultVisits: 1,
            basePrice: "33000.00",
            isActive: 0,
            historicalSourceKey: CASE_KEY,
          })
          .$returningId();
        const serviceId = Number(inserted[0]?.id);
        [service] = await tx.select().from(serviceCatalog).where(eq(serviceCatalog.id, serviceId)).limit(1);
      }
      if (!service) throw new Error("Não foi possível obter o serviço histórico criado.");

      let [opportunity] = await tx
        .select()
        .from(opportunities)
        .where(and(eq(opportunities.companyId, company.id), eq(opportunities.title, OPPORTUNITY_TITLE)))
        .limit(1)
        .for("update");
      if (!opportunity) {
        const inserted = await tx
          .insert(opportunities)
          .values({
            companyId: company.id,
            ownerId: OWNER_ID,
            title: OPPORTUNITY_TITLE,
            serviceType: "PMGIRS e instrumentos correlatos",
            source: "contrato_006_2026_guzolandia",
            stage: "execution",
            technicalPriority: "B",
            commercialPriority: "B",
            probability: 100,
            estimatedValue: "33000.00",
            notes:
              "Oportunidade histórica cadastrada por autorização expressa. Contrato e execução documental apresentados; não há atesto/aceite final, pagamento ou encerramento comprovados nesta homologação.",
            deliverables:
              "Documentados: respostas técnicas CETESB, instrução de renovação de LO, visita técnica, deslocamento e PLANCON Fase 1. Não presume entrega dos demais itens contratuais.",
            pendingItems:
              "Obter atesto/aceite final da contratante; verificar situação dos itens contratuais não abrangidos na Medição nº 01; definir eventual instrumento para Fase 2 do PLANCON, se aplicável.",
          })
          .$returningId();
        const opportunityId = Number(inserted[0]?.id);
        [opportunity] = await tx.select().from(opportunities).where(eq(opportunities.id, opportunityId)).limit(1);
      }
      if (!opportunity) throw new Error("Não foi possível obter a oportunidade histórica criada.");

      const clientSnapshot = JSON.stringify({
        id: company.id,
        cnpj: company.cnpj,
        legalName: company.legalName,
        tradeName: company.tradeName,
        address: company.address,
        addressNumber: company.addressNumber,
        city: company.city,
        state: company.state,
      });
      const serviceSnapshot = JSON.stringify({
        id: service.id,
        name: service.name,
        category: service.category,
        summary: service.summary,
        historicalSourceKey: CASE_KEY,
      });
      const sourceMap = sourceNote(
        uploadedDocuments.map(({ filename, sha256, bytes, key, url }) => ({ filename, sha256, bytes, key, url })),
      );

      const insertedProposal = await tx
        .insert(proposals)
        .values({
          seriesKey: PROPOSAL_SERIES,
          version: 1,
          proposalNumber: "H-006/2026",
          opportunityId: opportunity.id,
          companyId: company.id,
          serviceId: service.id,
          ownerId: OWNER_ID,
          professional: "Eng. Miguel Gentine — CREA/SP 5070449007",
          status: "issued",
          documentStatus: "issued",
          decisionStatus: "pending",
          clientSnapshot,
          serviceSnapshot,
          scopeSnapshot: service.scope,
          deliverablesSnapshot: service.deliverables,
          assumptionsSnapshot: service.assumptions,
          exclusionsSnapshot: service.exclusions,
          investment: "33000.00",
          paymentTerms: "Contrato nº 006/2026: pagamento conforme cláusula sexta. Pagamento não comprovado nos documentos analisados.",
          validityDays: 0,
          visitsIncluded: 1,
          missingInformation:
            "Não foram apresentados atesto/aceite final, comprovantes de pagamento, encerramento formal, aprovação administrativa final nem assinatura bilateral verificável nas páginas inspecionadas.",
          contractReference: "Contrato nº 006/2026",
          contractDocumentedAt: civilDateAtNoonBrt("2026-02-05"),
          sourceMap,
          notes:
            "Proposta histórica representativa do Contrato nº 006/2026; número H-006/2026 é identificador interno histórico e não reconstitui número de proposta não apresentado. A execução decorre da contratação documental autorizada, sem registrar aceite comercial final ou data/hora de decisão inexistente.",
          reviewedBy: OWNER_ID,
        })
        .$returningId();
      const proposalId = Number(insertedProposal[0]?.id);
      if (!Number.isInteger(proposalId) || proposalId <= 0) throw new Error("Não foi possível criar a proposta histórica.");

      const insertedProject = await tx
        .insert(executionProjects)
        .values({
          proposalId,
          opportunityId: opportunity.id,
          companyId: company.id,
          ownerId: OWNER_ID,
          title: PROJECT_TITLE,
          status: "in_progress",
          phase: "in_progress",
          activationBasis: "documented_contract",
          scopeSnapshot: service.scope,
          deliverablesSnapshot: service.deliverables,
          assumptionsSnapshot: service.assumptions,
          exclusionsSnapshot: service.exclusions,
          acceptanceNotes:
            "Projeto histórico em execução por autorização expressa. Existem contratação, execução e entregas documentadas; não há atesto, aceite final, pagamento ou encerramento formal comprovados nos arquivos apresentados.",
        })
        .$returningId();
      const projectId = Number(insertedProject[0]?.id);
      if (!Number.isInteger(projectId) || projectId <= 0) throw new Error("Não foi possível criar o projeto histórico.");

      for (const document of uploadedDocuments) {
        await tx.insert(projectEvidence).values({
          projectId,
          title: document.title,
          fileName: document.filename,
          mimeType: "application/pdf",
          fileKey: document.key,
          fileUrl: document.url,
          uploadedBy: OWNER_ID,
        });
      }

      const historicalActivities = [
        {
          key: `${CASE_KEY}:contrato`,
          happenedAt: civilDateAtNoonBrt("2026-02-05"),
          channel: "documental",
          objective: "Registro histórico de contratação",
          outcome:
            "Contrato nº 006/2026 apresentado, datado de 05/02/2026, para PMGIRS e instrumentos correlatos. A assinatura bilateral não foi verificada visualmente nesta homologação.",
        },
        {
          key: `${CASE_KEY}:visita-2026-03-28`,
          happenedAt: civilDateAtNoonBrt("2026-03-28"),
          channel: "visita_técnica",
          objective: "Levantamento de campo para renovação de LO",
          outcome:
            "Relatório de Visita Técnica nº 001/2026 registra visita ao aterro municipal em valas e levantamento de dados de campo. Horário não foi criado como fato no CRM; a data civil foi preservada por convenção técnica de meio-dia BRT.",
        },
        {
          key: `${CASE_KEY}:protocolo-2026-05-14`,
          happenedAt: civilDateAtNoonBrt("2026-05-14"),
          channel: "protocolo",
          objective: "Registro de protocolo CETESB",
          outcome:
            "Relatório de Protocolo nº 002/2026 e comprovante anexado registram resposta em 14/05/2026 no processo CETESB.022773/2026-72, aguardando análise técnica segundo o documento.",
        },
        {
          key: `${CASE_KEY}:entrega-plancon-2026-05-18`,
          happenedAt: civilDateAtNoonBrt("2026-05-18"),
          channel: "entrega_técnica",
          objective: "Entrega documentada do PLANCON Fase 1",
          outcome:
            "Relatório de Entrega Técnica registra PLANCON Fase 1 entregue em 18/05/2026. Não há atesto ou aceite final da contratante apresentado junto ao relatório.",
        },
      ];
      for (const activity of historicalActivities) {
        const [existingActivity] = await tx
          .select({ id: activities.id })
          .from(activities)
          .where(eq(activities.automationKey, activity.key))
          .limit(1);
        if (!existingActivity) {
          await tx.insert(activities).values({
            companyId: company.id,
            opportunityId: opportunity.id,
            ownerId: OWNER_ID,
            channel: activity.channel,
            objective: activity.objective,
            outcome: activity.outcome,
            automationKey: activity.key,
            happenedAt: activity.happenedAt,
          });
        }
      }

      const pendingTasks = [
        {
          title: "Obter atesto ou aceite final da contratante para entregas e Medição nº 01",
          notes: "Pendente porque não foi apresentada evidência documental de atesto/aceite final. Não representa tarefa concluída.",
        },
        {
          title: "Verificar situação dos itens contratuais não abrangidos pela Medição nº 01",
          notes: "Pendente documental: a medição apresentada cobre os itens 3 (Fase 1), 6, 7, 8 e 9; não presume conclusão dos demais itens do contrato.",
        },
        {
          title: "Definir eventual instrumento para Fase 2 do PLANCON, se aplicável",
          notes: "O relatório de entrega aponta Fase 2 como etapa subsequente condicionada a repactuação ou novo instrumento. Não há contratação de Fase 2 comprovada nos documentos apresentados.",
        },
      ];
      for (const task of pendingTasks) {
        const [existingTask] = await tx
          .select({ id: projectTasks.id })
          .from(projectTasks)
          .where(and(eq(projectTasks.projectId, projectId), eq(projectTasks.title, task.title)))
          .limit(1);
        if (!existingTask) {
          await tx.insert(projectTasks).values({
            projectId,
            title: task.title,
            category: "documental",
            ownerId: OWNER_ID,
            status: "open",
            notes: task.notes,
          });
        }
      }

      return { companyId: company.id, serviceId: service.id, opportunityId: opportunity.id, proposalId, projectId };
    }),
  );

  console.log(JSON.stringify({ alreadyApplied: false, ...ids, uploadedEvidence: uploadedDocuments.map(({ filename, sha256, bytes, key }) => ({ filename, sha256, bytes, key })) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
