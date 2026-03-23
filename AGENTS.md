# AGENTS.md — Guidance for AI Coding Agents

Instructions for coding agents (Claude Code, Cursor, Copilot, Codex, etc.) working on this documentation repository.

## Project Overview

Mintlify-based documentation for [Control Plane](https://controlplane.com). Control Plane is a hybrid multi-cloud platform for deploying and managing containerized workloads across AWS, GCP, Azure, and private clouds from a single, unified interface.

- **Docs site**: https://docs.controlplane.com
- **Console**: https://console.cpln.io
- **Framework**: [Mintlify](https://mintlify.com)

## Directory Structure

```
docs.json           — Navigation, tabs, groups, redirects, API config (source of truth for nav)
llms.txt            — AI-facing platform summary and full page index (source of truth for AI agents)
skill.md            — Capability summary for AI tool integration (overrides Mintlify auto-generated)
introduction.mdx    — Landing page
whatis.mdx          — Platform overview
concepts/           — Core concepts: org, GVC, workload, billing, access control
reference/          — Detailed resource configuration and behavior
guides/             — Step-by-step how-to guides for creating and configuring resources
core/               — Platform fundamentals: auth, security, logs, audit trail, query
mcp/                — MCP Server docs and AI tool setup guides
cli-reference/      — CLI installation, usage guides, troubleshooting (commands/ is GENERATED — do NOT edit manually)
iac/                — Infrastructure as Code (Terraform, Pulumi)
template-catalog/   — 30+ production-ready templates (Postgres, Redis, Kafka, etc.)
mk8s/               — Managed Kubernetes providers and add-ons
byok/               — CPLN Platform (Bring Your Own Kubernetes)
api-reference/      — REST API docs (GENERATED from OpenAPI — do NOT edit manually)
external-logging/   — External logging integrations (S3, Datadog, Coralogix, etc.)
content/            — JavaScript utilities (tab sync, redirects)
images/             — Screenshots and diagrams organized by section
logos/              — Brand assets (favicon, light/dark logos)
public/             — Static files served at root
```

## Critical Rules

### CLI Command Accuracy

**Never write a cpln command from memory.** Verify with `cpln <command> --help`. Full CLI conventions, resource command map, and hallucination traps: https://docs.controlplane.com/cli-conventions.md

### Do NOT edit generated content

**API Reference** — `api-reference/` pages are generated from OpenAPI specs. Never edit them manually.

- To regenerate: `npx @mintlify/scraping@latest openapi-file https://api.cpln.io/openapi.json -o api-reference`
- Audit API: `npx @mintlify/scraping@latest openapi-file https://audit.cpln.io/openapi.json -o api-reference/audit`

**CLI Reference** — `cli-reference/commands/` pages are generated from CLI help output by the `docs-cli-generator` tool. Never edit them manually.

- The following files are also auto-generated and should not be edited, you can only edit them in the `docs-cli-generator/` sibling repository:
  - `cli-reference/installation.mdx`
  - `cli-reference/using-cli/help.mdx`
  - `cli-reference/ci-cd-development/container-image.mdx`
- To regenerate: run `npm run gen-full` and then `make publish` in the `docs-cli-generator/` sibling repository. `make publish` creates a PR to this docs repository which must be reviewed and merged. Once merged to `main`, Mintlify automatically deploys the changes.

### Update llms.txt and skill.md when platform facts change

- If you change workload types, autoscaling rules, secret access model, networking model, or any platform constraint, update `llms.txt` and `skill.md` to match.
- These files are consumed by AI agents and must stay accurate.
- **After completing a significant change** (new feature, new page, modified behavior), review `llms.txt` and determine if new entries or updates are needed. The page index section must list every non-API page in `docs.json`. The Essential Platform Knowledge section should cover any gotcha-prone areas.

### Fix contradictions everywhere

- If you find a fact stated differently in two places, fix all occurrences, not just one.
- Key areas prone to contradiction: workload type capabilities, Capacity AI restrictions, autoscaling strategy availability, secret access requirements, domain behavior by workload type.

## Frontmatter Conventions

Every `.mdx` file must start with a YAML frontmatter block:

```yaml
---
title: 'Page Title'
sidebarTitle: 'Sidebar Label' # Optional, defaults to title
description: 'Brief page summary.' # Required, max 300 characters
keywords: ['synonym', 'abbreviation', 'related tech', 'alias'] # Required for hand-authored pages
---
```

- **title**: Displayed as the page heading. Use sentence case.
- **sidebarTitle**: Optional override for the navigation sidebar.
- **description**: Used by Mintlify for SEO meta tags and `llms-full.txt` generation. Must be present on every page. Keep under 300 characters.
- **keywords**: Search index supplements. Required on every hand-authored page so Mintlify search returns the page for terms users type but that aren't in `title`/`description` (e.g., `cloudflare`, `k8s`, `kubectl apply`, `eks alternative`). See the keywords rules below. Skip on auto-generated pages under `cli-reference/commands/` and `api-reference/` (those are regenerated and lose manual edits).

### Keywords rules

- **Format**: YAML flow-style, single-quoted strings — `keywords: ['term1', 'term2']`. Lowercase except acronyms (CLI, GVC, AWS).
- **Count**: 8-15 per page. Each phrase ≤4 words.
- **Pick from**: synonyms/abbreviations (`k8s`/`kubernetes`, `lb`/`load balancer`); cloud or vendor names the page integrates with (`aws`, `cloudflare`, `datadog`); adjacent tech the user is migrating from (`terraform`, `helm`, `kubectl`, `eks`); problem-phrasing (`scale to zero`, `port forward`, `rolling deploy`); feature aliases not in the title (logs page → `loki`, `tail`); concrete identifiers (CLI flags like `--ready`, env var names).
- **Do NOT include**: words already in `title` or `description`; generic platform terms (`control plane`, `cloud`, `deploy`); marketing adjectives (`powerful`, `easy`); whole sentences; misspellings.

## MDX Component Library

These are the Mintlify components used throughout the docs. Import is automatic (no import statements needed).

### Layout Components

| Component | Purpose                                                                                      |
| --------- | -------------------------------------------------------------------------------------------- |
| Card      | Clickable card with title, icon, and optional href. Use `horizontal` prop for compact layout |
| CardGroup | Grid wrapper for Card elements. Use `cols={2}` or `cols={3}`                                 |
| Frame     | Image wrapper that adds a border and caption support                                         |

### Callout Components

| Component | Purpose                                                   |
| --------- | --------------------------------------------------------- |
| Tip       | Green callout for best practices and recommendations      |
| Info      | Blue callout for supplementary information                |
| Warning   | Yellow callout for important caveats and breaking changes |
| Note      | Gray callout for general notes                            |

### Interactive Components

| Component                  | Purpose                                                                  |
| -------------------------- | ------------------------------------------------------------------------ |
| Tabs / Tab                 | Tabbed content. Each Tab requires a `title` prop                         |
| Accordion / AccordionGroup | Collapsible sections. Each Accordion requires a `title` prop             |
| Steps / Step               | Numbered step-by-step instructions. Each Step requires a `title` prop    |
| CodeGroup                  | Tabbed code blocks. Place fenced code blocks inside with language labels |

See any existing page in the repo for live usage examples of these components.

## Navigation Configuration

Navigation is defined in `docs.json` under the `navigation` key.

### How to Add a New Page

1. Create the `.mdx` file with proper frontmatter — `title`, `description`, and `keywords` (see Frontmatter Conventions).
2. Add the page path (without `.mdx` extension) to the appropriate `pages` array in `docs.json`.
3. Groups can be nested for sub-navigation (see `reference/workload` or `guides/create-secret`).

### Current Tabs

Documentation, How-to Guides, Template Catalog, Managed Kubernetes, CPLN Platform, MCP Server, Infra as Code, CLI Reference, API Reference.

**Note:** If you add a new tab, update this list. Also update `llms.txt` to include the new tab's pages in the page index.

## Content Routing

| Content type                         | Where it goes                                 | Example                                             |
| :----------------------------------- | :-------------------------------------------- | :-------------------------------------------------- |
| What a resource is, why it exists    | `concepts/`                                   | Organization overview, GVC benefits                 |
| Exact fields, constraints, behavior  | `reference/`                                  | Workload autoscaling strategies, policy permissions |
| Step-by-step instructions            | `guides/`                                     | Create a workload, configure a domain               |
| CLI command documentation            | `cli-reference/commands/` (GENERATED)         | `cpln workload`, `cpln secret` — do NOT edit here   |
| CLI usage guides and troubleshooting | `cli-reference/` (non-commands pages)         | Profiles, output formats, shell completion          |
| AI tool integration                  | `mcp/`                                        | MCP server setup, usage examples                    |
| Terraform/Pulumi usage               | `iac/`                                        | Provider installation and configuration             |
| Platform features spanning resources | `core/`                                       | Authentication, logging, audit trail                |
| Error resolution                     | `reference/error-messages.mdx`                | Deployment errors, secret access failures           |
| CLI-specific issues                  | `cli-reference/using-cli/troubleshooting.mdx` | Installation, auth, connectivity                    |

**CLI content note:** All CLI command pages under `cli-reference/commands/` are auto-generated by `docs-cli-generator` — never edit them directly. CLI-related guides, tutorials, and troubleshooting content that is NOT command reference goes in `cli-reference/` under the appropriate subdirectory (e.g., `get-started/`, `using-cli/`, `ci-cd-development/`).

## Build and Preview

No `package.json` exists — Mintlify CLI is used directly:

```bash
# Preview locally (starts dev server on port 3000)
npx mintlify dev

# Check for broken internal links
npx mintlify broken-links
```

Run both before considering work done.

## Writing Guidelines

### LLM-Friendliness Standards

1. **Every `.mdx` file MUST have a `description` frontmatter field** (max 300 characters). This powers SEO and LLM context.
2. **Never use "click here"** as link text. Use descriptive text: `[workload reference](/reference/workload/general)` not `[click here](/reference/workload/general)`.
3. **Sections should be self-contained.** A reader (human or AI) should understand a section without having read prior sections.
4. **Define terms on first use per page.** Write "Global Virtual Cloud (GVC)" before using "GVC" alone.
5. **All code blocks must have language identifiers** (` ```yaml `, ` ```bash `, ` ```json `).
6. **Headings should include feature context.** Use "GVC Overview" rather than just "Overview" when the heading appears in search results.

### Troubleshooting Content

- **Searchable error text**: Include the exact error message users see.
- **Self-contained entries**: Each troubleshooting accordion should have symptom, cause, and fix.
- **Use the AccordionGroup/Accordion pattern** established throughout the repo.

### Content Patterns

- Use Tabs with "Console", "CLI", "Terraform", and "Pulumi" tabs when showing multiple workflow paths. Not all tabs are needed on every page — include "Terraform" and "Pulumi" where IaC alternatives exist.
- Link to reference pages using relative paths without `.mdx` extension: `[workload](/reference/workload/general)`.
- Place screenshots in `images/{section}/` matching the content directory structure.
- Use Tip for best practices, Warning for gotchas and breaking changes, Info for supplementary context.
- **No speculative claims**: Only document what the platform actually does. If unsure, check the reference page or API.

### Terminology Conventions

| Context      | Use                     | Do Not Use             |
| ------------ | ----------------------- | ---------------------- |
| Prose        | Control Plane           | CPLN, ControlPlane, CP |
| CLI tool     | `cpln`                  | CPLN, Cpln             |
| API base URL | `api.cpln.io`           | —                      |
| Console URL  | `console.cpln.io`       | —                      |
| Docs URL     | `docs.controlplane.com` | —                      |

### Redirects

When moving or renaming pages, add a redirect entry in `docs.json` under the `redirects` array:

```json
{
  "source": "/old/path",
  "destination": "/new/path"
}
```

## Key Facts Agents Must Know

These are the most common sources of documentation errors:

1. **Scale to zero** is ONLY for Serverless workloads with `rps` or `concurrency` strategies
2. **Capacity AI** does NOT work with Stateful workloads or CPU autoscaling
3. **Secret access** requires three steps: identity + policy + reference (all three mandatory)
4. **Identities** are GVC-scoped, a workload can reference only one, but an identity can be shared across multiple workloads in the same GVC. One cloud account per provider
5. **Pull secrets** are GVC-level, not per-workload. A pull secret assigned to a GVC allows all workloads in that GVC to pull images from the configured registry (Docker Hub, ECR, GCR, etc.)
6. **Internal firewall default** is `none` by default (no inter-workload communication)
7. **External firewall default** is disabled by default (both inbound and outbound)
8. **Serverless Host header** is the canonical endpoint, not the custom domain
9. **Cron workloads** deploy to all GVC locations with no location overrides
10. **Images** must be `linux/amd64`
11. **Orgs are immutable** — once created, an org cannot be deleted
12. **`cpln workload log` does NOT exist** — use `cpln logs '{gvc="GVC", workload="WORKLOAD"}'` with LogQL syntax
13. **Volume shrink destroys data** — `shrinkVolume` provisions a NEW smaller volume; existing data is NOT migrated. Only use for systems with data replication (Kafka, CockroachDB)
14. **Don't set `spec.identityLink` unless needed** — only assign an identity when the workload needs secret access, credential-free cloud access, or private network access (via agents)
15. **Never use `docker.io/` prefix for external images** — use the exact image reference as-is (e.g., `nginx:latest`, not `docker.io/library/nginx:latest`). The registry hostname `<org>.registry.cpln.io` is only for `docker login`, never in workload specs
