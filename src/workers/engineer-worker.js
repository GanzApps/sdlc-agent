"use strict";

const { runWithRetry } = require("../libs/reliability/retry");
const { validateTicketContract } = require("./ticket-contract");

async function processNextTicket({ queue, workerId, executeTicket, logger, metrics, maxRetry = 3 }) {
  const next = queue.listReadyTickets()[0];
  if (!next) {
    return { handled: false, reason: "no_ticket" };
  }

  const claimed = queue.claimTicket(next.id, workerId);
  if (!claimed) {
    return { handled: false, reason: "claim_failed" };
  }

  logger.info("ticket.claimed", {
    ticket_id: claimed.id,
    worker_id: workerId,
    workflow_id: claimed.workflowId
  });
  metrics.increment("ticket_claim_total", 1);

  const contractValidation = validateTicketContract(claimed);
  if (!contractValidation.valid) {
    const reason = `Ticket contract incomplete. Missing required fields: ${contractValidation.missing.join(", ")}`;
    const blocked = queue.block(claimed.id, reason, contractValidation.missing);
    metrics.increment("ticket_blocked_total", 1);
    logger.warn("ticket.blocked", {
      ticket_id: claimed.id,
      status: blocked ? blocked.status : "Blocked",
      missing_fields: contractValidation.missing
    });

    return {
      handled: true,
      status: blocked ? blocked.status : "Blocked",
      ticket: blocked,
      reason: "ticket_contract_incomplete"
    };
  }

  const start = Date.now();
  try {
    const output = await runWithRetry(
      async (attempt) => executeTicket({ ticket: claimed, attempt }),
      {
        maxAttempts: maxRetry,
        baseDelayMs: 100,
        factor: 2,
        onRetry: ({ attempt, delayMs, error }) => {
          logger.warn("ticket.retry", {
            ticket_id: claimed.id,
            attempt,
            delay_ms: delayMs,
            error: error.message
          });
          metrics.increment("ticket_retry_total", 1);
        }
      }
    );

    const completed = queue.complete(claimed.id, { nextStatus: "Review", output });
    metrics.increment("ticket_success_total", 1);
    metrics.observe("ticket_duration_ms", Date.now() - start);

    logger.info("ticket.completed", {
      ticket_id: claimed.id,
      status: completed.status,
      duration_ms: Date.now() - start
    });

    return { handled: true, status: completed.status, ticket: completed };
  } catch (error) {
    const attemptsUsed = Number.isInteger(error.attempts) ? error.attempts : 1;
    const failed = queue.fail(claimed.id, error.message, maxRetry, attemptsUsed);
    metrics.increment("ticket_failure_total", 1);
    logger.error("ticket.failed", {
      ticket_id: claimed.id,
      status: failed ? failed.status : "Failed",
      error: error.message
    });

    return {
      handled: true,
      status: failed ? failed.status : "Failed",
      ticket: failed,
      error
    };
  }
}

module.exports = { processNextTicket };
