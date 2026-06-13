import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const [
    dealsWithMissingClosedTimestamps,
    leadsWithMissingClosedTimestamps,
    closedDealsWithoutClosedStage,
    tasksWithoutOwnerAndAssignee,
    stagesWithoutPipeline,
  ] = await Promise.all([
    db.deal.count({
      where: {
        archivedAt: null,
        status: { in: ["WON", "LOST", "ABANDONED"] },
        closedAt: null,
      },
    }),
    db.lead.count({
      where: {
        archivedAt: null,
        status: { in: ["CONVERTED", "LOST"] },
        OR: [{ convertedAt: null, status: "CONVERTED" }, { lostAt: null, status: "LOST" }],
      },
    }),
    db.deal.count({
      where: {
        archivedAt: null,
        status: { in: ["WON", "LOST", "ABANDONED"] },
        stage: {
          isClosed: false,
        },
      },
    }),
    db.task.count({
      where: {
        archivedAt: null,
        assigneeId: null,
        creatorId: null,
      },
    }),
    db.stage.count({
      where: {
        pipeline: {
          archivedAt: { not: null },
        },
      },
    }),
  ]);

  assert(
    dealsWithMissingClosedTimestamps === 0,
    `Kapali durumda ama closedAt olmayan aktif deal bulundu: ${dealsWithMissingClosedTimestamps}`,
  );
  assert(
    leadsWithMissingClosedTimestamps === 0,
    `Kapali durumda ama donusum/kayip zamani olmayan aktif lead bulundu: ${leadsWithMissingClosedTimestamps}`,
  );
  assert(
    closedDealsWithoutClosedStage === 0,
    `Kapali statude ama kapali olmayan stage'de duran deal bulundu: ${closedDealsWithoutClosedStage}`,
  );
  assert(
    tasksWithoutOwnerAndAssignee === 0,
    `Hem creator hem assignee bilgisi olmayan aktif gorev bulundu: ${tasksWithoutOwnerAndAssignee}`,
  );
  assert(
    stagesWithoutPipeline === 0,
    `Arsivlenmis pipeline'a bagli aktif stage bulundu: ${stagesWithoutPipeline}`,
  );

  console.log("Operational assertions passed");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
