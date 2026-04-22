"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { assessWorkspace, formatAssessment } = require("./readiness");

const FRAMEWORK_DOCS = [
  "AGENTS.md",
  "HELP.md",
  "PHASES.md",
  "DELIVERY-RECORD.md",
  "WORKSPACE-SETUP-AND-MANIFEST.md",
];

const KNOWLEDGE_FOLDERS = [
  "workspace",
  "product",
  "architecture",
  "design",
  "engineering",
  "operations",
];

const KNOWLEDGE_CONTRACTS = {
  workspace: [
    {
      file: "project-overview.md",
      title: "Project Overview",
      lines: [
        "Status: draft",
        "Owner: human",
        "Last updated: YYYY-MM-DD",
        "",
        "## Purpose",
        "Summarize what this workspace is delivering and the business context.",
        "",
        "## Scope",
        "- Product or service name",
        "- Current delivery scope",
        "- Primary stakeholders",
      ],
    },
    {
      file: "connector-map.md",
      title: "Connector Map",
      lines: [
        "Status: draft",
        "Owner: human",
        "Last updated: YYYY-MM-DD",
        "",
        "## Connected tools",
        "- docs:",
        "- tickets:",
        "- code:",
        "- design:",
      ],
    },
    {
      file: "repository-map.md",
      title: "Repository Map",
      lines: [
        "Status: draft",
        "Owner: human",
        "Last updated: YYYY-MM-DD",
        "",
        "## Repositories",
        "- Target repositories and purpose",
        "- Default branches",
        "- Ownership notes",
      ],
    },
  ],
  product: [
    {
      file: "domain-context.md",
      title: "Domain Context",
      lines: [
        "Status: draft",
        "Owner: human",
        "Last updated: YYYY-MM-DD",
        "",
        "## Domain summary",
        "- User problem",
        "- Business goals",
        "- Key constraints",
      ],
    },
  ],
  architecture: [
    {
      file: "system-overview.md",
      title: "System Overview",
      lines: [
        "Status: draft",
        "Owner: human",
        "Last updated: YYYY-MM-DD",
        "",
        "## System map",
        "- Services",
        "- Integrations",
        "- Data boundaries",
      ],
    },
  ],
  design: [
    {
      file: "baseline-status.md",
      title: "Design Baseline Status",
      lines: [
        "Status: draft",
        "Owner: human",
        "Last updated: YYYY-MM-DD",
        "",
        "## Baseline state",
        "- Exists or missing",
        "- Source of truth link",
        "- Follow-up needed",
      ],
    },
  ],
  engineering: [
    {
      file: "repository-standards.md",
      title: "Repository Standards",
      lines: [
        "Status: draft",
        "Owner: human",
        "Last updated: YYYY-MM-DD",
        "",
        "## Standards",
        "- Branching rules",
        "- Test expectations",
        "- Review requirements",
      ],
    },
  ],
  operations: [
    {
      file: "environment-map.md",
      title: "Environment Map",
      lines: [
        "Status: draft",
        "Owner: human",
        "Last updated: YYYY-MM-DD",
        "",
        "## Environments",
        "- Development",
        "- Staging",
        "- Production",
      ],
    },
  ],
};

const DEFAULT_CONNECTOR_TOOLS = {
  docs: "notion",
  tickets: "jira",
  code: "github",
  design: "figma",
};

function parseArgs(argv) {
  const args = { _: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) {
      args._.push(part);
      continue;
    }

    const key = part.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(sourcePath, destinationPath) {
  ensureDir(path.dirname(destinationPath));
  fs.copyFileSync(sourcePath, destinationPath);
}

function copyDirectory(sourceDir, destinationDir, renameMap = {}) {
  ensureDir(destinationDir);
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const nextName = renameMap[entry.name] || entry.name;
    const destinationPath = path.join(destinationDir, nextName);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath, renameMap);
      continue;
    }

    copyFile(sourcePath, destinationPath);
  }
}

function createReadme(filePath, title, lines) {
  const content = [`# ${title}`, "", ...lines, ""].join("\n");
  fs.writeFileSync(filePath, content, "utf8");
}

function renderAgentConfig(options) {
  const executorModel =
    options.executor === "claude-code" ? "claude-sonnet-4-6" : "gpt-5.4";
  const fallbackTool =
    options.executor === "claude-code" ? "codex" : "claude-code";
  const fallbackModel =
    options.executor === "claude-code" ? "gpt-5.4" : "claude-sonnet-4-6";

  const connectors = ["docs", "tickets", "code", "design"]
    .map((role) => {
      const selected = options.connectors.includes(role);
      const tool = options.connectorTools[role] || DEFAULT_CONNECTOR_TOOLS[role];
      const lines = [
        `  ${role}:`,
        `    tool: ${tool}`,
        '    url: ""',
        '    mcp_url: ""',
      ];

      if (role === "tickets") {
        lines.push('    mcp_command: ""');
      }
      if (role === "code") {
        lines.push('    default_branch: "main"');
        lines.push('    skills_repo: ""');
      }
      lines.push(`    status: ${selected ? "connected" : "not-configured"}`);
      return lines.join("\n");
    })
    .join("\n\n");

  return [
    'version: "1.0"',
    "",
    "workspace:",
    `  name: "${escapeYaml(options.workspaceName)}"`,
    `  project: "${escapeYaml(options.projectName)}"`,
    "",
    "connectors:",
    connectors,
    "",
    "executor:",
    "  primary:",
    `    tool: ${options.executor}`,
    `    model: ${executorModel}`,
    "  fallback:",
    `    tool: ${fallbackTool}`,
    `    model: ${fallbackModel}`,
    "  zero_cost:",
    "    tool: opencode",
    '    model: "deepseek/deepseek-chat"',
    "",
    "handoff:",
    "  store: docs",
    '  folder: "AI-SDLC / Handoffs"',
    "",
  ].join("\n");
}

function renderManifest(options) {
  const connectors = ["docs", "tickets", "code", "design"]
    .map((role) => {
      const selected = options.connectors.includes(role);
      return [
        `  ${role}:`,
        `    required: ${selected ? "true" : "false"}`,
        `    status: ${selected ? "connected" : "not-configured"}`,
      ].join("\n");
    })
    .join("\n");

  const enabledAgents = [
    "product-agent",
    "design-agent",
    "techplan-agent",
    "planner-agent",
    "engineer-agent",
    "incident-engineer-agent",
    "devops-agent",
  ]
    .map((name) => `    - ${name}`)
    .join("\n");

  const today = new Date().toISOString().slice(0, 10);

  return [
    "framework:",
    "  name: ai-sdlc",
    '  version: "0.1.0"',
    `  installed_at: "${today}"`,
    "  install_mode: local-poc",
    "",
    "workspace:",
    `  name: "${escapeYaml(options.workspaceName)}"`,
    `  project: "${escapeYaml(options.projectName)}"`,
    "  initialized: true",
    `  initialized_at: "${today}"`,
    "",
    "executors:",
    `  primary: ${options.executor}`,
    `  fallback: ${options.executor === "claude-code" ? "codex" : "claude-code"}`,
    "  zero_cost: opencode",
    "",
    "connectors:",
    connectors,
    "",
    "framework_managed:",
    "  - .ai-sdlc/",
    "",
    "workspace_local:",
    "  - .agent-config.yml",
    "  - knowledge/",
    "  - artifacts/",
    "  - source-code/",
    "",
    "capabilities:",
    "  enabled_agents:",
    enabledAgents,
    "",
    "setup:",
    "  delivery_record_store: docs",
    "  design_baseline_known: false",
    "  setup_status: ready",
    "",
  ].join("\n");
}

function escapeYaml(value) {
  return String(value).replace(/"/g, '\\"');
}

function renderAdapterFile(executor) {
  const label = executor === "claude-code" ? "Claude Code" : "Codex";
  return [
    `# ${label} Workspace Adapter`,
    "",
    "Start by reading these files in order:",
    "1. `.ai-sdlc/HELP.md`",
    "2. `.ai-sdlc/AGENTS.md`",
    "3. `knowledge/`",
    "4. delivery record artifacts under `artifacts/delivery-records/`",
    "",
    "Framework rules:",
    "- use `/help` for command discovery when supported",
    "- use plain-language fallback if slash commands are unavailable",
    "- continue from artifacts and records, not old chat history",
    "",
    "Recommended next actions after install:",
    "- `/help`",
    "- `/ai-init`",
    "",
  ].join("\n");
}

async function promptIfMissing(value, question, rl) {
  if (value && value !== true) {
    return value;
  }
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function promptChoice(rl, question, choices, defaultValue) {
  const choiceText = choices
    .map((choice, index) => `${index + 1}. ${choice.label}`)
    .join("\n");

  const prompt = `${question}\n${choiceText}\nChoose an option${
    defaultValue ? ` (default: ${defaultValue})` : ""
  }: `;

  while (true) {
    const answer = await promptIfMissing(undefined, prompt, rl);
    const normalized = (answer || defaultValue || "").trim();

    if (!normalized) {
      continue;
    }

    const byIndex = Number(normalized);
    if (Number.isInteger(byIndex) && byIndex >= 1 && byIndex <= choices.length) {
      return choices[byIndex - 1].value;
    }

    const byValue = choices.find(
      (choice) =>
        choice.value.toLowerCase() === normalized.toLowerCase() ||
        choice.label.toLowerCase() === normalized.toLowerCase()
    );

    if (byValue) {
      return byValue.value;
    }

    console.log("Please choose one of the listed options.");
  }
}

async function collectOptions(args) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const target =
      (await promptIfMissing(
        args.target,
        "Target workspace path (default: ./poc-workspace): ",
        rl
      )) || "./poc-workspace";
    const workspaceName = await promptIfMissing(
      args.workspace,
      "Workspace or company name: ",
      rl
    );
    const projectName = await promptIfMissing(
      args.project,
      "Project name: ",
      rl
    );
    const executorInput =
      args.executor ||
      (await promptChoice(
        rl,
        "Primary executor",
        [
          { label: "Claude Code", value: "claude-code" },
          { label: "Codex", value: "codex" },
        ],
        "1"
      ));
    let connectors = [];
    if (Object.prototype.hasOwnProperty.call(args, "connectors")) {
      connectors = String(args.connectors)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    } else {
      const configureNow =
        (
          await promptIfMissing(
            undefined,
            "Configure connectors now? (`yes` or `no`, default: no): ",
            rl
          )
        ) || "no";

      if (/^y(es)?$/i.test(configureNow)) {
        const connectorsInput =
          (await promptIfMissing(
            undefined,
            "Connectors (comma separated, for example docs,tickets,code,design): ",
            rl
          )) || "";

        connectors = connectorsInput
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean);
      }
    }

    const connectorTools = {
      docs: args["docs-tool"] || DEFAULT_CONNECTOR_TOOLS.docs,
      tickets: args["tickets-tool"] || DEFAULT_CONNECTOR_TOOLS.tickets,
      code: args["code-tool"] || DEFAULT_CONNECTOR_TOOLS.code,
      design: args["design-tool"] || DEFAULT_CONNECTOR_TOOLS.design,
    };

    return {
      target,
      workspaceName,
      projectName,
      executor: executorInput,
      connectors,
      connectorTools,
    };
  } finally {
    rl.close();
  }
}

function validateOptions(options) {
  const allowedExecutors = new Set(["claude-code", "codex"]);
  if (!allowedExecutors.has(options.executor)) {
    throw new Error(
      `Unsupported executor "${options.executor}". Use "claude-code" or "codex" for the POC.`
    );
  }
}

function initializeWorkspace(options, context) {
  const targetRoot = path.resolve(process.cwd(), options.target);
  ensureDir(targetRoot);

  const frameworkRoot = path.join(targetRoot, ".ai-sdlc");
  ensureDir(frameworkRoot);

  for (const docName of FRAMEWORK_DOCS) {
    copyFile(
      path.join(context.sourceRoot, docName),
      path.join(frameworkRoot, docName)
    );
  }

  copyDirectory(path.join(context.sourceRoot, "agents"), path.join(frameworkRoot, "agents"));
  copyDirectory(path.join(context.sourceRoot, "skills"), path.join(frameworkRoot, "skills"));
  copyDirectory(
    path.join(context.sourceRoot, "templates"),
    path.join(frameworkRoot, "templates")
  );
  copyDirectory(
    path.join(context.sourceRoot, "manifests"),
    path.join(frameworkRoot, "manifests")
  );
  copyFile(
    path.join(context.sourceRoot, ".agent-config.example.yml"),
    path.join(frameworkRoot, ".agent-config.example.yml")
  );

  fs.writeFileSync(
    path.join(targetRoot, ".agent-config.yml"),
    renderAgentConfig(options),
    "utf8"
  );
  fs.writeFileSync(
    path.join(targetRoot, "ai-sdlc.manifest.yml"),
    renderManifest(options),
    "utf8"
  );

  const knowledgeRoot = path.join(targetRoot, "knowledge");
  for (const folder of KNOWLEDGE_FOLDERS) {
    const folderPath = path.join(knowledgeRoot, folder);
    ensureDir(folderPath);
    const readmePath = path.join(folderPath, "README.md");
    if (!fs.existsSync(readmePath)) {
      createReadme(readmePath, `${capitalize(folder)} Knowledge`, [
        "This folder is part of the AI SDLC workspace knowledge layer.",
        "Add long-lived shared context here so later AI threads can continue without old chat history.",
      ]);
    }

    for (const contract of KNOWLEDGE_CONTRACTS[folder] || []) {
      const contractPath = path.join(folderPath, contract.file);
      if (!fs.existsSync(contractPath)) {
        createReadme(contractPath, contract.title, contract.lines);
      }
    }
  }

  const deliveryArtifacts = path.join(targetRoot, "artifacts", "delivery-records");
  ensureDir(deliveryArtifacts);
  const artifactsReadme = path.join(deliveryArtifacts, "README.md");
  if (!fs.existsSync(artifactsReadme)) {
    createReadme(artifactsReadme, "Delivery Record Artifacts", [
      "Use this folder for local mirrors of delivery records and handoff snapshots.",
      "Primary source-of-truth records should still live in the configured docs connector.",
    ]);
  }

  const adapterDir =
    options.executor === "claude-code"
      ? path.join(targetRoot, ".claude")
      : path.join(targetRoot, ".codex");
  ensureDir(adapterDir);
  fs.writeFileSync(
    path.join(adapterDir, "FRAMEWORK.md"),
    renderAdapterFile(options.executor),
    "utf8"
  );

  return {
    targetRoot,
    frameworkRoot,
    adapterDir,
  };
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

async function runCli(argv, context) {
  const args = parseArgs(argv);
  const [command] = args._;

  if (!command || command === "help" || args.help) {
    console.log("Usage: ai-sdlc <command> [options]");
    console.log("");
    console.log("Commands:");
    console.log("  init                      Initialize a workspace");
    console.log("  status                    Check readiness for a workspace");
    console.log("");
    console.log("Options:");
    console.log("  --target <path>         Target workspace path");
    console.log("  --workspace <name>      Workspace or company name");
    console.log("  --project <name>        Project name");
    console.log("  --executor <name>       claude-code or codex");
    console.log(
      "  --connectors <list>     Comma-separated connectors, e.g. docs,tickets,code,design"
    );
    console.log("  --docs-tool <name>      Docs tool, e.g. notion");
    console.log("  --tickets-tool <name>   Tickets tool, e.g. jira");
    console.log("  --code-tool <name>      Code tool, e.g. github");
    console.log("  --design-tool <name>    Design tool, e.g. figma");
    return;
  }

  if (command === "status") {
    const targetRoot = path.resolve(process.cwd(), args.target || ".");
    const assessment = assessWorkspace(targetRoot);
    console.log(formatAssessment(assessment, targetRoot));
    return;
  }

  if (command !== "init") {
    throw new Error(`Unknown command "${command}". Supported commands: init, status`);
  }

  const options = await collectOptions(args);
  validateOptions(options);
  const result = initializeWorkspace(options, context);
  const assessment = assessWorkspace(result.targetRoot);

  console.log(`Initialized AI SDLC workspace at ${result.targetRoot}`);
  console.log(`Primary executor adapter: ${result.adapterDir}`);
  console.log(`Readiness result: ${assessment.status}`);
  console.log("Next steps:");
  console.log("1. Open the generated workspace in your AI executor");
  console.log("2. Start with /help");
  if (options.connectors.length === 0) {
    console.log("3. Then run /ai-init to connect your tools later");
  } else {
    console.log("3. Then run /ai-init");
  }
}

module.exports = {
  runCli,
};
