"use strict";

const fs = require("fs");
const path = require("path");

const CONNECTOR_KEYS = ["docs", "tickets", "code", "design"];

const REQUIRED_FRAMEWORK_DOCS = [
  "AGENTS.md",
  "HELP.md",
  "PHASES.md",
  "DELIVERY-RECORD.md",
  "WORKSPACE-SETUP-AND-MANIFEST.md",
];

const REQUIRED_KNOWLEDGE_FILES = [
  "knowledge/workspace/project-overview.md",
  "knowledge/workspace/connector-map.md",
  "knowledge/workspace/repository-map.md",
  "knowledge/product/domain-context.md",
  "knowledge/architecture/system-overview.md",
  "knowledge/design/baseline-status.md",
];

function exists(targetPath) {
  return fs.existsSync(targetPath);
}

function detectWorkspaceMode(rootPath) {
  const installedSignals = [
    path.join(rootPath, ".ai-sdlc"),
    path.join(rootPath, ".agent-config.yml"),
    path.join(rootPath, "ai-sdlc.manifest.yml"),
  ];
  const frameworkSignals = [
    path.join(rootPath, "sdk", "init.js"),
    path.join(rootPath, "package.json"),
    path.join(rootPath, "AGENTS.md"),
  ];

  if (installedSignals.every(exists)) {
    return "installed-workspace";
  }

  if (frameworkSignals.every(exists)) {
    return "framework-source";
  }

  return "unknown";
}

function parseAgentConfig(configPath) {
  if (!exists(configPath)) {
    return null;
  }

  const content = fs.readFileSync(configPath, "utf8");
  const versionMatch = content.match(/version:\s*"([^"]+)"/);
  const workspaceNameMatch = content.match(/workspace:\s*\n\s+name:\s*"([^"]*)"/m);
  const projectNameMatch = content.match(/workspace:\s*\n(?:.*\n)*?\s+project:\s*"([^"]*)"/m);
  const primaryToolMatch = content.match(/executor:\s*\n\s+primary:\s*\n\s+tool:\s*([^\n]+)/m);

  const connectors = {};
  for (const role of CONNECTOR_KEYS) {
    const blockMatch = content.match(
      new RegExp(`${role}:\\s*\\n((?:\\s{4}[^\\n]+\\n?)*)`, "m")
    );
    const block = blockMatch ? blockMatch[1] : "";
    connectors[role] = {
      tool: extractScalar(block, "tool"),
      url: extractQuoted(block, "url"),
      mcp_url: extractQuoted(block, "mcp_url"),
      mcp_command: extractQuoted(block, "mcp_command"),
      status: extractScalar(block, "status"),
    };
  }

  return {
    version: versionMatch ? versionMatch[1] : "",
    workspace: {
      name: workspaceNameMatch ? workspaceNameMatch[1] : "",
      project: projectNameMatch ? projectNameMatch[1] : "",
    },
    executor: {
      primary: {
        tool: primaryToolMatch ? primaryToolMatch[1].trim() : "",
      },
    },
    connectors,
  };
}

function parseManifest(manifestPath) {
  if (!exists(manifestPath)) {
    return null;
  }

  const content = fs.readFileSync(manifestPath, "utf8");
  const installModeMatch = content.match(/install_mode:\s*([^\n]+)/);
  const setupStatusMatch = content.match(/setup:\s*\n(?:.*\n)*?\s+setup_status:\s*([^\n]+)/m);

  const connectors = {};
  for (const role of CONNECTOR_KEYS) {
    const blockMatch = content.match(
      new RegExp(`${role}:\\s*\\n((?:\\s{4}[^\\n]+\\n?)*)`, "m")
    );
    const block = blockMatch ? blockMatch[1] : "";
    connectors[role] = {
      required: extractScalar(block, "required"),
      status: extractScalar(block, "status"),
    };
  }

  return {
    installMode: installModeMatch ? installModeMatch[1].trim() : "",
    setupStatus: setupStatusMatch ? setupStatusMatch[1].trim() : "",
    connectors,
  };
}

function extractScalar(block, key) {
  const match = block.match(new RegExp(`\\b${key}:\\s*([^\\n"]+)`, "m"));
  return match ? match[1].trim() : "";
}

function extractQuoted(block, key) {
  const quoted = block.match(new RegExp(`\\b${key}:\\s*"([^"]*)"`, "m"));
  if (quoted) {
    return quoted[1];
  }
  return extractScalar(block, key);
}

function determineOverallStatus(blockers, risks) {
  if (blockers.length > 0) {
    return "BLOCKED";
  }
  if (risks.length > 0) {
    return "READY WITH RISKS";
  }
  return "READY";
}

function validateInstalledWorkspace(rootPath) {
  const blockers = [];
  const risks = [];
  const notes = [];
  const frameworkRoot = path.join(rootPath, ".ai-sdlc");
  const configPath = path.join(rootPath, ".agent-config.yml");
  const manifestPath = path.join(rootPath, "ai-sdlc.manifest.yml");

  if (!exists(frameworkRoot)) {
    blockers.push("Missing framework-managed directory `.ai-sdlc/`.");
  }

  for (const docName of REQUIRED_FRAMEWORK_DOCS) {
    if (!exists(path.join(frameworkRoot, docName))) {
      blockers.push(`Missing framework document \`.ai-sdlc/${docName}\`.`);
    }
  }

  const config = parseAgentConfig(configPath);
  if (!config) {
    blockers.push("Missing workspace config `.agent-config.yml`.");
  } else {
    if (config.version !== "1.0") {
      blockers.push(
        `Unsupported config schema version "${config.version || "unknown"}". Expected "1.0".`
      );
    }
    if (!config.workspace.name || !config.workspace.project) {
      blockers.push("Workspace identity is incomplete in `.agent-config.yml`.");
    }
  }

  const manifest = parseManifest(manifestPath);
  if (!manifest) {
    blockers.push("Missing framework manifest `ai-sdlc.manifest.yml`.");
  } else if (!manifest.installMode) {
    risks.push("Manifest does not declare `framework.install_mode`.");
  }

  for (const relativePath of REQUIRED_KNOWLEDGE_FILES) {
    if (!exists(path.join(rootPath, relativePath))) {
      risks.push(`Missing recommended knowledge contract file \`${relativePath}\`.`);
    }
  }

  if (config) {
    const connectedRoles = [];
    for (const role of CONNECTOR_KEYS) {
      const connector = config.connectors[role] || {};
      const status = connector.status || "missing";

      if (!status) {
        blockers.push(`Connector \`${role}\` is missing a status in \`.agent-config.yml\`.`);
        continue;
      }

      if (status === "connected") {
        connectedRoles.push(role);

        if (!connector.tool) {
          blockers.push(`Connector \`${role}\` is marked connected but has no tool.`);
        }

        if (!connector.url && !connector.mcp_url && !connector.mcp_command) {
          risks.push(
            `Connector \`${role}\` is connected but does not define \`url\`, \`mcp_url\`, or \`mcp_command\`.`
          );
        }
      } else if (status === "not-configured") {
        notes.push(`Connector \`${role}\` is not configured yet.`);
      } else {
        risks.push(`Connector \`${role}\` is in non-standard status \`${status}\`.`);
      }
    }

    if (connectedRoles.length === 0) {
      risks.push(
        "No connectors are marked `connected`, so delivery agents will stop until `/ai-init` completes tool setup."
      );
    }
  }

  const overall = determineOverallStatus(blockers, risks);
  return {
    mode: "installed-workspace",
    status: overall,
    blockers,
    risks,
    notes,
    config,
    manifest,
  };
}

function validateFrameworkSource(rootPath) {
  const blockers = [];
  const risks = [];
  const notes = [
    "This repository is the framework source, so live connector setup is optional here.",
  ];

  const expectedPaths = [
    "AGENTS.md",
    "README.md",
    "HELP.md",
    "PHASES.md",
    "DELIVERY-RECORD.md",
    "WORKSPACE-SETUP-AND-MANIFEST.md",
    "agents",
    "skills",
    "sdk/init.js",
    "sdk/readiness.js",
    "bin/ai-sdlc.js",
    ".agent-config.example.yml",
    "templates",
    "manifests",
  ];

  for (const relativePath of expectedPaths) {
    if (!exists(path.join(rootPath, relativePath))) {
      blockers.push(`Missing framework source path \`${relativePath}\`.`);
    }
  }

  return {
    mode: "framework-source",
    status: determineOverallStatus(blockers, risks),
    blockers,
    risks,
    notes,
    config: null,
    manifest: null,
  };
}

function assessWorkspace(rootPath) {
  const mode = detectWorkspaceMode(rootPath);

  if (mode === "installed-workspace") {
    return validateInstalledWorkspace(rootPath);
  }

  if (mode === "framework-source") {
    return validateFrameworkSource(rootPath);
  }

  return {
    mode,
    status: "BLOCKED",
    blockers: [
      "Workspace mode is unknown. Expected either a framework source repo or an installed workspace.",
    ],
    risks: [],
    notes: [],
    config: null,
    manifest: null,
  };
}

function formatAssessment(assessment, targetRoot) {
  const lines = [
    `Workspace: ${targetRoot}`,
    `Mode: ${assessment.mode}`,
    `Status: ${assessment.status}`,
  ];

  if (assessment.config) {
    lines.push(
      `Workspace identity: ${assessment.config.workspace.name || "<missing>"} / ${
        assessment.config.workspace.project || "<missing>"
      }`
    );
    lines.push(
      `Primary executor: ${assessment.config.executor.primary.tool || "<missing>"}`
    );
  }

  if (assessment.blockers.length > 0) {
    lines.push("");
    lines.push("Blocked:");
    for (const item of assessment.blockers) {
      lines.push(`- ${item}`);
    }
  }

  if (assessment.risks.length > 0) {
    lines.push("");
    lines.push("Risks:");
    for (const item of assessment.risks) {
      lines.push(`- ${item}`);
    }
  }

  if (assessment.notes.length > 0) {
    lines.push("");
    lines.push("Notes:");
    for (const item of assessment.notes) {
      lines.push(`- ${item}`);
    }
  }

  lines.push("");
  lines.push("Recommended next step:");
  lines.push(`- ${recommendNextCommand(assessment)}`);

  return lines.join("\n");
}

function recommendNextCommand(assessment) {
  if (assessment.mode === "framework-source") {
    return "Run `ai-sdlc init --target <workspace>` to generate an installed workspace for testing.";
  }

  if (assessment.status === "BLOCKED") {
    return "Run `/ai-init` to repair workspace readiness before any delivery agent starts.";
  }

  if (assessment.status === "READY WITH RISKS") {
    return "Run `/ai-init` to complete connector setup and fill the remaining workspace knowledge contracts.";
  }

  return "Run `/help` and then start the next role-specific `*-init` command for the current phase.";
}

module.exports = {
  assessWorkspace,
  detectWorkspaceMode,
  formatAssessment,
};
