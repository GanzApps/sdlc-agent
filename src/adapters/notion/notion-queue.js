"use strict";

const { createLease, isExpired } = require("../../libs/reliability/lease");

class InMemoryNotionQueue {
  constructor(tickets = []) {
    this.tickets = tickets.map((ticket) => ({ ...ticket }));
  }

  listReadyTickets() {
    return this.tickets
      .filter((t) => t.status === "Ready")
      .sort((a, b) => (a.priority || 999) - (b.priority || 999) || a.createdAt.localeCompare(b.createdAt));
  }

  claimTicket(ticketId, workerId, ttlMs = 15 * 60 * 1000) {
    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.status !== "Ready") {
      return null;
    }

    ticket.status = "In Progress";
    ticket.workerId = workerId;
    ticket.lease = createLease(ttlMs);
    ticket.claimedAt = new Date().toISOString();
    return { ...ticket };
  }

  heartbeat(ticketId, workerId, ttlMs = 15 * 60 * 1000) {
    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket || ticket.workerId !== workerId || ticket.status !== "In Progress") {
      return false;
    }
    ticket.lease = {
      ...ticket.lease,
      leaseUntilMs: Date.now() + ttlMs
    };
    return true;
  }

  complete(ticketId, updates = {}) {
    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket) {
      return null;
    }
    ticket.status = updates.nextStatus || "Review";
    ticket.output = updates.output || {};
    ticket.completedAt = new Date().toISOString();
    return { ...ticket };
  }

  fail(ticketId, reason, maxRetry = 3, attemptsUsed = 1) {
    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket) {
      return null;
    }

    ticket.retryCount = (ticket.retryCount || 0) + attemptsUsed;
    ticket.lastError = reason;

    if (ticket.retryCount >= maxRetry) {
      ticket.status = "Failed";
    } else {
      ticket.status = "Ready";
      delete ticket.workerId;
      delete ticket.lease;
    }

    return { ...ticket };
  }

  block(ticketId, reason, missingFields = []) {
    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket) {
      return null;
    }

    ticket.status = "Blocked";
    ticket.lastError = reason;
    ticket.missingFields = missingFields.slice();
    ticket.blockedAt = new Date().toISOString();
    delete ticket.workerId;
    delete ticket.lease;

    return { ...ticket };
  }

  recoverExpiredTickets(now = Date.now()) {
    let recovered = 0;
    for (const ticket of this.tickets) {
      if (ticket.status === "In Progress" && ticket.lease && isExpired(ticket.lease, now)) {
        ticket.status = "Ready";
        ticket.lastError = "Lease expired; requeued by self-healing";
        delete ticket.workerId;
        delete ticket.lease;
        recovered += 1;
      }
    }
    return recovered;
  }
}

module.exports = { InMemoryNotionQueue };
