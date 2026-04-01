"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { InMemoryNotionQueue } = require("../../src/adapters/notion/notion-queue");
const { processNextTicket } = require("../../src/workers/engineer-worker");
const { createLogger } = require("../../src/libs/observability/logger");
const { MetricsRegistry } = require("../../src/libs/observability/metrics");

function buildCompleteTicket(overrides = {}) {
  return {
    id: "ENG-10",
    workflowId: "wf-10",
    title: "task",
    description: "Implement runtime worker behavior",
    component: "Backend API",
    priority: 1,
    targetRepository: "https://github.com/oeganz/sdlc-agent (feat/runtime-orchestrator-v1)",
    inputsContext: "PRD/Design/TechDoc links provided",
    acceptanceCriteria: "Worker processes Ready tickets end-to-end",
    expectedOutput: "Ticket moved to Review with output payload",
    testPlan: "Run unit and e2e tests",
    dependenciesOrNotes: "No blocker",
    status: "Ready",
    createdAt: "2026-04-01T00:00:00.000Z",
    ...overrides
  };
}

test("engineer worker claims and moves ticket to Review", async () => {
  const queue = new InMemoryNotionQueue([buildCompleteTicket()]);

  const result = await processNextTicket({
    queue,
    workerId: "w-1",
    logger: createLogger({ test: true }),
    metrics: new MetricsRegistry(),
    executeTicket: async () => ({ ok: true })
  });

  assert.equal(result.handled, true);
  assert.equal(result.status, "Review");
});

test("engineer worker marks Failed after retries exhausted", async () => {
  const queue = new InMemoryNotionQueue([
    buildCompleteTicket({
      id: "ENG-11",
      workflowId: "wf-11",
      retryCount: 0
    })
  ]);

  const result = await processNextTicket({
    queue,
    workerId: "w-2",
    logger: createLogger({ test: true }),
    metrics: new MetricsRegistry(),
    maxRetry: 2,
    executeTicket: async () => {
      throw new Error("fatal");
    }
  });

  assert.equal(result.handled, true);
  assert.equal(result.status, "Failed");
});

test("engineer worker marks Blocked when ticket contract is incomplete", async () => {
  const queue = new InMemoryNotionQueue([
    buildCompleteTicket({
      id: "ENG-12",
      description: ""
    })
  ]);
  let executed = false;

  const result = await processNextTicket({
    queue,
    workerId: "w-3",
    logger: createLogger({ test: true }),
    metrics: new MetricsRegistry(),
    executeTicket: async () => {
      executed = true;
      return { ok: true };
    }
  });

  assert.equal(result.handled, true);
  assert.equal(result.status, "Blocked");
  assert.equal(result.reason, "ticket_contract_incomplete");
  assert.equal(executed, false);
  assert.equal(result.ticket.lastError.includes("Missing required fields: Description"), true);
  assert.deepEqual(result.ticket.missingFields, ["Description"]);
});
