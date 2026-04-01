"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { WorkflowEngine } = require("../../src/orchestrator/workflow-engine");
const { InMemoryNotionQueue } = require("../../src/adapters/notion/notion-queue");
const { processNextTicket } = require("../../src/workers/engineer-worker");
const { createLogger } = require("../../src/libs/observability/logger");
const { MetricsRegistry } = require("../../src/libs/observability/metrics");

function buildCompleteTicket(overrides = {}) {
  return {
    id: "ENG-E2E-1",
    workflowId: "wf-e2e",
    title: "build feature",
    description: "Deliver one runtime feature",
    component: "Backend API",
    priority: 1,
    targetRepository: "https://github.com/oeganz/sdlc-agent (feat/runtime-orchestrator-v1)",
    inputsContext: "Tasktify implementation docs",
    acceptanceCriteria: "Ticket reaches Review status",
    expectedOutput: "PR output with tests info",
    testPlan: "Execute unit + e2e",
    dependenciesOrNotes: "None",
    status: "Ready",
    retryCount: 0,
    createdAt: "2026-04-01T00:00:00.000Z",
    ...overrides
  };
}

test("e2e: workflow progresses to engineering and processes one ticket", async () => {
  const logger = createLogger({ test: "e2e" });
  const metrics = new MetricsRegistry();

  const workflow = new WorkflowEngine({ workflowId: "wf-e2e", logger, metrics });
  workflow.transition("PRD");
  workflow.transition("DESIGN");
  workflow.transition("TECHDOC");
  workflow.transition("TICKETS");
  workflow.transition("ENGINEERING");

  const queue = new InMemoryNotionQueue([buildCompleteTicket()]);

  const result = await processNextTicket({
    queue,
    workerId: "worker-e2e",
    logger,
    metrics,
    executeTicket: async () => ({ prUrl: "https://example/pr/1", tests: { unit: "pass", e2e: "pass" } })
  });

  assert.equal(result.status, "Review");
  assert.equal(workflow.getState().stage, "ENGINEERING");

  workflow.transition("REVIEW");
  workflow.transition("DONE");

  assert.equal(workflow.getState().status, "COMPLETED");
});

test("e2e: self-healing requeues expired in-progress ticket", () => {
  const queue = new InMemoryNotionQueue([
    buildCompleteTicket({
      id: "ENG-E2E-2",
      title: "recover"
    })
  ]);

  const claimed = queue.claimTicket("ENG-E2E-2", "worker", 1);
  assert.equal(claimed.status, "In Progress");

  const recoveredCount = queue.recoverExpiredTickets(Date.now() + 10);
  assert.equal(recoveredCount, 1);

  const readyAgain = queue.listReadyTickets()[0];
  assert.equal(readyAgain.id, "ENG-E2E-2");
  assert.equal(readyAgain.status, "Ready");
});
