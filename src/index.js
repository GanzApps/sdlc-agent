"use strict";

const { createLogger } = require("./libs/observability/logger");
const { MetricsRegistry } = require("./libs/observability/metrics");
const { WorkflowEngine } = require("./orchestrator/workflow-engine");
const { InMemoryNotionQueue } = require("./adapters/notion/notion-queue");
const { processNextTicket } = require("./workers/engineer-worker");

async function main() {
  const logger = createLogger({ service: "sdlc-runtime" });
  const metrics = new MetricsRegistry();

  const workflow = new WorkflowEngine({
    workflowId: "wf-demo-001",
    logger,
    metrics
  });

  workflow.transition("PRD", { source: "bootstrap" });
  workflow.transition("DESIGN");
  workflow.transition("TECHDOC");
  workflow.transition("TICKETS");
  workflow.transition("ENGINEERING");

  const queue = new InMemoryNotionQueue([
    {
      id: "ENG-001",
      workflowId: "wf-demo-001",
      title: "Implement payment retry handler",
      description: "Add retry-safe payment handling with observability",
      component: "Backend API",
      status: "Ready",
      priority: 1,
      targetRepository: "https://github.com/oeganz/sdlc-agent (feat/runtime-orchestrator-v1)",
      inputsContext: "Tasktify artifacts and runtime requirements",
      acceptanceCriteria: "Ticket execution reaches Review and includes test evidence",
      expectedOutput: "PR URL and implementation summary",
      testPlan: "Run unit + e2e tests",
      dependenciesOrNotes: "No blocker",
      retryCount: 0,
      createdAt: new Date().toISOString()
    }
  ]);

  await processNextTicket({
    queue,
    workerId: "engineer-agent-01",
    logger,
    metrics,
    executeTicket: async ({ ticket }) => ({
      prUrl: "https://github.com/example/repo/pull/123",
      summary: `Implemented ${ticket.title}`,
      tests: {
        unit: "pass",
        e2e: "pass"
      }
    })
  });

  workflow.transition("REVIEW");
  logger.info("runtime.metrics", { snapshot: metrics.snapshot() });
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
