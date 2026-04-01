"use strict";

function hasValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function getFirstPresent(ticket, keys) {
  for (const key of keys) {
    if (hasValue(ticket[key])) {
      return ticket[key];
    }
  }
  return undefined;
}

const REQUIRED_CONTRACT_FIELDS = [
  { name: "Title", keys: ["title", "Title"] },
  { name: "Description", keys: ["description", "Description"] },
  { name: "Component", keys: ["component", "Component"] },
  { name: "Priority", keys: ["priority", "Priority"] },
  { name: "Target Repository", keys: ["targetRepository", "repository", "repo"] },
  { name: "Inputs and Context", keys: ["inputsContext", "context", "references"] },
  { name: "Acceptance Criteria", keys: ["acceptanceCriteria", "acceptance_criteria", "ac"] },
  { name: "Expected Output", keys: ["expectedOutput", "expected_output"] },
  { name: "Test Plan", keys: ["testPlan", "test_plan"] },
  { name: "Dependencies or Notes", keys: ["dependenciesOrNotes", "dependencies", "notes", "Notes"] }
];

function validateTicketContract(ticket) {
  const missing = [];
  for (const requiredField of REQUIRED_CONTRACT_FIELDS) {
    const value = getFirstPresent(ticket, requiredField.keys);
    if (!hasValue(value)) {
      missing.push(requiredField.name);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

module.exports = {
  REQUIRED_CONTRACT_FIELDS,
  validateTicketContract
};
