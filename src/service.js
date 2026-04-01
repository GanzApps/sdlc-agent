"use strict";

const http = require("http");
const { createLogger } = require("./libs/observability/logger");
const { MetricsRegistry } = require("./libs/observability/metrics");
const { WorkflowEngine } = require("./orchestrator/workflow-engine");
const { InMemoryNotionQueue } = require("./adapters/notion/notion-queue");
const { processNextTicket } = require("./workers/engineer-worker");

function envNumber(name, fallback) {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildSeedTickets() {
  return [
    {
      id: "ENG-001",
      workflowId: "wf-runtime-001",
      title: "Implement retry-safe API client",
      description: "Build resilient API client with retry and observability",
      component: "Backend API",
      status: "Ready",
      priority: 1,
      targetRepository: "https://github.com/oeganz/sdlc-agent (feat/runtime-orchestrator-v1)",
      inputsContext: "Tasktify PRD/Design/Tech Design docs",
      acceptanceCriteria: "Execution path retries transient failures and returns summary",
      expectedOutput: "Review-ready output with PR URL and test evidence",
      testPlan: "Run npm test and include unit/e2e status",
      dependenciesOrNotes: "No external blocker",
      retryCount: 0,
      createdAt: new Date().toISOString()
    }
  ];
}

async function main() {
  const config = {
    port: envNumber("PORT", 3000),
    pollIntervalMs: envNumber("POLL_INTERVAL_MS", 10000),
    leaseTtlMs: envNumber("LEASE_TTL_MS", 15 * 60 * 1000),
    maxRetry: envNumber("MAX_RETRY", 3)
  };

  const logger = createLogger({ service: "sdlc-runtime" });
  const metrics = new MetricsRegistry();
  const queue = new InMemoryNotionQueue(buildSeedTickets());

  const workflow = new WorkflowEngine({
    workflowId: "wf-runtime-001",
    logger,
    metrics
  });
  workflow.transition("PRD", { source: "service_boot" });
  workflow.transition("DESIGN");
  workflow.transition("TECHDOC");
  workflow.transition("TICKETS");
  workflow.transition("ENGINEERING");

  const state = {
    startedAt: new Date().toISOString(),
    lastTickAt: null,
    healthy: true,
    shuttingDown: false
  };

  const workerId = "engineer-agent-runtime-01";

  async function executeTicket({ ticket, attempt }) {
    logger.info("ticket.execute", {
      ticket_id: ticket.id,
      attempt
    });

    return {
      prUrl: "https://github.com/example/repo/pull/placeholder",
      summary: `Executed ticket ${ticket.id}: ${ticket.title}`,
      tests: {
        unit: "pass",
        e2e: "pass"
      }
    };
  }

  async function tick() {
    if (state.shuttingDown) {
      return;
    }
    state.lastTickAt = new Date().toISOString();

    const recovered = queue.recoverExpiredTickets();
    if (recovered > 0) {
      metrics.increment("self_heal_requeue_total", recovered);
      logger.warn("ticket.self_heal_requeue", { count: recovered });
    }

    const result = await processNextTicket({
      queue,
      workerId,
      logger,
      metrics,
      maxRetry: config.maxRetry,
      executeTicket
    });

    if (!result.handled && result.reason === "no_ticket") {
      metrics.increment("worker_idle_tick_total", 1);
    }

    if (result.status === "Review") {
      workflow.transition("REVIEW", { ticket_id: result.ticket.id });
    }

    const remainingReady = queue.listReadyTickets().length;
    if (remainingReady === 0 && result.status === "Review") {
      workflow.transition("DONE");
    }
  }

  const interval = setInterval(() => {
    tick().catch((error) => {
      state.healthy = false;
      metrics.increment("worker_tick_failure_total", 1);
      logger.error("worker.tick_failed", { error: error.message });
    });
  }, config.pollIntervalMs);

  interval.unref();

  const server = http.createServer((req, res) => {
    if (req.url === "/health") {
      const body = {
        status: state.healthy ? "ok" : "degraded",
        started_at: state.startedAt,
        last_tick_at: state.lastTickAt,
        shutting_down: state.shuttingDown
      };
      res.writeHead(state.healthy ? 200 : 503, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
      return;
    }

    if (req.url === "/metrics") {
      res.writeHead(200, { "Content-Type": "text/plain; version=0.0.4" });
      res.end(metrics.toPrometheus());
      return;
    }

    if (req.url === "/ready") {
      const ready = !state.shuttingDown;
      res.writeHead(ready ? 200 : 503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ready }));
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not_found" }));
  });

  server.listen(config.port, () => {
    logger.info("service.started", {
      port: config.port,
      poll_interval_ms: config.pollIntervalMs,
      lease_ttl_ms: config.leaseTtlMs,
      max_retry: config.maxRetry
    });
  });

  async function shutdown(signal) {
    if (state.shuttingDown) {
      return;
    }
    state.shuttingDown = true;
    logger.warn("service.shutdown_requested", { signal });
    clearInterval(interval);
    await new Promise((resolve) => server.close(resolve));
    logger.info("service.stopped", { signal });
    process.exit(0);
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
