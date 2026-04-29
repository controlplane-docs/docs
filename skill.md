---
name: cpln
description: Use when deploying and managing containerized workloads across multiple clouds (AWS, GCP, Azure, private), configuring multi-cloud infrastructure, managing secrets and access control, setting up identities for credential-free cloud access, automating deployments with GitOps, or connecting AI tools to Control Plane via the MCP Server.
license: Apache-2.0
compatibility: Requires cpln CLI (npm @controlplane/cli, Homebrew, or binary) or MCP Server (https://mcp.cpln.io/mcp). Works with any CI/CD platform, Terraform, Pulumi, and Kubernetes.
allowed-tools: cpln
metadata:
  mintlify-proj: controlplanecorporation
  author: controlplane
  version: '3.0'
---

# Control Plane Skill

## What is Control Plane

Control Plane is a hybrid platform for deploying and managing containerized workloads across AWS, GCP, Azure, and private clouds from a unified interface. It abstracts cloud provider differences behind a consistent API, CLI (`cpln`), Console UI, Terraform provider, Pulumi provider, Kubernetes Operator, and MCP Server. Certified PCI DSS Level 1, SOC 2 Type II, and HIPAA-eligible.

**Key entry points:**

- CLI: `cpln` — install via npm `@controlplane/cli`, Homebrew (`brew tap controlplane-com/cpln && brew install cpln`), or binary
- Console: https://console.cpln.io
- API: https://api.cpln.io
- MCP Server: `https://mcp.cpln.io/mcp` (80+ tools for AI agents)
- Docs: https://docs.controlplane.com (page index for AI agents: https://docs.controlplane.com/llms.txt)
- Full CLI conventions and hallucination traps: https://docs.controlplane.com/cli-conventions.md

## When to use this skill

Deploying workloads across multi-cloud GVCs, configuring infrastructure (locations, networking, firewall, domains), managing secrets + identity + policy access chains, automating with `cpln apply` / CI/CD, debugging via `cpln logs` / `exec` / `connect` / `port-forward`, building and pushing images, migrating from Kubernetes / Docker Compose / Helm, working with mk8s / BYOK / Kubernetes Operator, or connecting AI tools via MCP Server.

## Resource model

```
Org (Organization) — top-level isolation boundary, globally unique name
├── Principals: Users, Groups, Service Accounts           (org-scoped)
├── Governance: Policies, Quotas, Audit Contexts          (org-scoped)
├── Infrastructure: Cloud Accounts, Agents, Locations,    (org-scoped)
│                   IP Sets, mk8s clusters
├── Assets: Secrets (12 types), Images, Domains           (org-scoped)
└── GVC (Global Virtual Cloud) — deployment environment
    ├── Workloads (1+ containers, four types)             (GVC-scoped)
    ├── Identities (cloud access, secrets, networks)      (GVC-scoped)
    └── Volume Sets (persistent storage)                  (GVC-scoped)
```

**Scoping rules:**

- **Org-scoped**: Secrets, Domains, Cloud Accounts, Agents, Policies, Images, Groups, Service Accounts, IP Sets, mk8s
- **GVC-scoped**: Workloads, Identities, Volume Sets
- A workload can reference secrets from its parent org but only volume sets and identities from its own GVC
- Domains are org-scoped but associated with exactly one GVC at a time
- Pull secrets are configured at the **GVC level**, not per workload — only Docker, ECR, and GCP secret types work as pull secrets
- One identity per workload, but an identity can be shared across multiple workloads within the same GVC. Identities cannot be shared across GVCs — recreate the identity with the same spec in each GVC that needs it.

## Platform capabilities

| Capability | What it is | When to use |
| --- | --- | --- |
| **Workloads** | Deploy containers as serverless, standard, cron, or stateful | Primary deployment unit — most users start here |
| **Template Catalog** | 30+ production-ready templates (Postgres, Redis, Kafka, MongoDB, etc.) | Need a database, queue, or common service — install instead of building from scratch |
| **Managed Kubernetes (mk8s)** | Provision Kubernetes clusters across AWS, GCP, Azure, Hetzner, and more | Need a full Kubernetes cluster (teams deploy INTO mk8s clusters) |
| **CPLN Platform (BYOK)** | Register existing Kubernetes clusters as Control Plane locations | Already have Kubernetes — want Control Plane workload management on top |
| **Kubernetes Operator** | Manage Control Plane resources as Kubernetes CRDs (ArgoCD/GitOps) | Want Kubernetes-native GitOps for Control Plane infrastructure |
| **Agents** | Secure tunnels to private networks (VPCs, on-prem, data centers) | Workloads need to reach private TCP endpoints behind firewalls |
| **External Logging** | Ship logs to S3, CloudWatch, Coralogix, Datadog, Logz.io, Stackdriver | Compliance, long-term retention, or external log analysis |
| **Domains** | Custom domain routing with auto-TLS, geo-routing, path-based routing | Expose workloads on your own domain with CNAME or NS delegation |
| **MCP Server** | 80+ tools for AI agents to manage infrastructure programmatically | AI-assisted infrastructure management |

## Guardrails — read these first

Eight rules that prevent the production failures real users have hit. Skipping them costs data loss, cross-tenant changes, silent runtime failures, or burned token budgets.

### 1. Org / profile / GVC confirmation before mutating

Before any state-mutating `cpln` command (`create`, `delete`, `update`, `apply`, `patch`, `edit`, `add-binding`, `remove-binding`, `add-key`, `force-redeployment`, `clone`, `image build --push`, secret `create-*` variants, `add-location`, `remove-location`), the target **org**, **profile**, and (where applicable) **GVC** must be unambiguously established. If any is missing, **stop and ask. Never silently fall back to the active CLI profile.**

Context is established only when: the user named it in the current request, named it earlier this conversation, called MCP `set_context` this session, or gave an explicit "use my default profile" instruction. Otherwise ask:

> Before I run this, I want to confirm the target. Your active profile appears to be `<name>` (org: `<org>`, GVC: `<gvc>`). Should I use that, or a different org / profile / GVC?

For **read-only** commands (`get`, `query`, `audit`, `logs`, `permissions`, `access-report`, `eventlog`), defaulting is acceptable — but **announce the target first**: *"Using profile `<name>` → org `<org>`, GVC `<gvc>`…"*

### 2. Secret access — 3 mandatory steps

A workload CANNOT access a secret without ALL three:

1. **Identity** created and assigned: `cpln workload update WL --gvc GVC --set spec.identityLink=//identity/ID`
2. **Policy** granting the identity `reveal`: `cpln policy create --name P --target-kind secret --resource SECRET` then `cpln policy add-binding P --permission reveal --identity //gvc/GVC/identity/ID`
3. **Reference** in env vars or volumes: `cpln://secret/NAME.payload` (opaque), `cpln://secret/NAME.KEY` (dictionary), `.username`/`.password` (userpass), `.cert`/`.key` (tls), etc.

Missing any one = silent runtime failure. The #1 support issue.

### 3. Image references

- **NEVER** prefix external images with `docker.io/`. Use `nginx:latest`, not `docker.io/library/nginx:latest`.
- **Own org's registry** in workload specs: `//image/NAME:TAG`. The hostname `<own-org>.registry.cpln.io` is only for `docker login`/`push`, never in workload specs.
- **Cross-org pull**: `<other-org>.registry.cpln.io/NAME:TAG`.
- Images must be `linux/amd64`. `cpln image build --push` defaults to this. Wrong platform = `exec format error` at runtime.
- The workload spec `port` must match the port the container actually listens on, or health checks fail.

### 4. Firewall defaults — everything is denied

- **Internal** (workload-to-workload): `inboundAllowType: none` — all blocked. Set to `same-gvc`, `same-org`, or `workload-list`.
- **External inbound**: disabled. Add CIDRs (`0.0.0.0/0` for all) or use `--public` on `cpln workload create`.
- **External outbound**: disabled. Add CIDRs or hostnames. Hostname egress restricted to ports 80, 443, 445; CIDR rules take precedence over hostname; blocked rules take precedence over allowed.

A workload without firewall config cannot reach its database, be reached by users, or talk to peers. Always configure explicitly.

### 5. Workload type constraints (immutable after creation)

| Feature | serverless | standard | stateful | cron |
| --- | --- | --- | --- | --- |
| Scale to zero | `rps` or `concurrency` | KEDA only | KEDA only | No |
| Ports | Exactly 1 container × 1 port (required) | 0 or more | 0 or more | Must NOT expose any |
| Capacity AI | Yes (default) | Yes (default) | **Always disabled** | N/A |
| Persistent volumes | No | No | Yes (volume sets) | No |
| `replicaDirect` LB | No | No | **Only this type** | No |
| `spec.job` | Forbidden | Forbidden | Forbidden | Required |
| Multi-metric autoscaling | No | Yes (cpu/memory/rps) | Yes (cpu/memory/rps) | N/A |
| `maxConcurrency` | Used | Ignored | Ignored | N/A |
| `timeoutSeconds` max | 600 | 3600 | 3600 | N/A |
| Max containers per workload | 8 | 8 | 8 | 8 |

- **Workload type is immutable.** Changing type requires delete + recreate. Capture state first: `cpln workload get NAME --gvc GVC -o yaml-slim > NAME.bak.yaml`.
- **Capacity AI** is incompatible with: Stateful, CPU autoscaling, multi-metric autoscaling, GPUs.
- **Cron** deploys to ALL GVC locations with no overrides. `spec.job` with `schedule` required; probes, autoscaling, `timeoutSeconds`, `capacityAI`, `debug` ignored.
- **Workload name** max 49 chars; cannot end with `-headless`.
- For container name reservations, probe XOR rules, GPU constraints, and full validation, fetch [/reference/workload/general](https://docs.controlplane.com/reference/workload/general) when authoring manifests.

### 6. Destructive operations — confirm with blast radius

Before any destructive operation, present a structured summary AND wait for explicit confirmation — **even when permissions auto-approve.** Permission mode is tool-prompt UX; this is conversation-level safety, independent.

- **Always destructive**: any `cpln <resource> delete`, `gvc delete-all-workloads`, `volumeset shrink`, `volumeset snapshot delete`, `volumeset volume delete`.
- **Service-disrupting**: `policy remove-binding` (breaks runtime access), `serviceaccount remove-key` (breaks CI/CD), `group remove-member` (locks users out), `gvc remove-location` (forces redeployment).
- **Implicit destructive (immutability traps)**: org delete impossible; workload type/name immutable (rename via `cpln workload clone OLD --name NEW --gvc GVC`); volume set `fileSystemType` and `performanceClass` immutable; `cpln apply` of a renamed resource creates a new one (old must be deleted with `cpln delete --file ...`).

When delete + recreate is the only path: (1) capture state with `-o yaml-slim`, (2) reuse the same name to preserve URL/internal DNS/domain routes/policy targetLinks/identity bindings, (3) confirm — the user authorized the *goal*, not the *technique*.

**Required confirmation shape:**

> I need to run a destructive operation:
>
> - **Action**: `<exact command(s)>`
> - **Affected**: `<name + kind>` in `<org>` / `<gvc>`
> - **Blast radius**: `<traffic, in-flight requests, downstream callers, data on disk, CI/CD pipelines, public URLs>`
> - **Reversibility**: `<reversible via X / not reversible>`
> - **Mitigation**: `<captured manifest as <file>.bak.yaml; will reuse same name; etc.>`
>
> Confirm to proceed.

Anything but an unambiguous yes means stop. Bundle multi-destructive tasks into one upfront ask; don't bundle destructive with non-destructive to slip it through.

### 7. Constraint conflicts — surface, don't silently default

When a compatibility constraint blocks the user's intent (concurrency autoscaling on stateful, scale-to-zero on cron, snapshots on `shared` volume sets, Capacity AI with CPU metric), surface it and present alternatives. **Never silently downgrade to `disabled` / `none` / `1 replica` / `manual`** — those often ship an under-provisioning bug or SPOF.

**Required shape:**

> I hit a constraint configuring `<resource>`:
>
> - **You asked for**: `<intent>`
> - **Constraint**: `<exact limitation>`
> - **Alternatives**:
>   - **`<value>`** — `<what, tradeoff>`
>   - **`<value>`** — `<...>`
> - **My recommendation**: `<option>` because `<project-grounded reasoning>`.
>
> Which would you like? Or revisit the upstream choice (e.g. workload type)?

Even when the conservative default IS right (e.g. `min=max=1` for single-writer SQLite), say so explicitly with reasoning. Sometimes the right answer is to back out of an earlier decision.

### 8. Long-running operations — don't poll from the AI layer

Stateful provisioning, large image pushes, mk8s creation, GVC location adds — minutes long. **Never poll status from the AI layer.** Each poll re-reads conversation context, burning thousands of tokens for zero diagnostic value.

**Default wait**: `cpln apply --file <m>.yaml --ready`. Blocks inside the CLI; AI tokens ≈ 0.

**Gap**: `--ready` does NOT fail fast on terminal container errors (non-zero exit, image pull error, crashloop, fatal startup). On a misconfigured first-deploy, plain `--ready` sits through its full timeout while the container is dead.

**Use the patience-windowed safety net** (run `--ready` in background, sleep the expected wait, then watch every 30s for confirmed terminal errors) for: first-deploys, newly-built images, workload type migrations, re-applies after a recent failure. Plain `--ready` is fine for: image-tag bumps, env updates, small config tweaks on healthy workloads. **Full bash pattern**: [/guides/cpln-apply](https://docs.controlplane.com/guides/cpln-apply).

**Other waits:**

- App-layer: `curl --retry 30 --retry-delay 5 --retry-connrefused -fsS https://<endpoint>/healthz` (find endpoint via `cpln workload get WL --gvc GVC -o json | jq -r .status.endpoint`)
- Ops without `--ready` (`force-redeployment`, post-`update`): `timeout 600 bash -c 'until cpln workload get N --gvc G -o json | jq -e ".status.healthCheck.status == true" >/dev/null 2>&1; do sleep 10; done'`

**Hard rule — on FAILED / killed / timeout: diagnose, don't re-wait.** Fetch in one breath: `cpln workload get-deployments N --gvc G` (failed deployment + exact error), `cpln logs '{gvc="G", workload="N"}' --org ORG` for stderr, re-read manifest. Fix, re-apply with safety net. After `READY`, **at most one** follow-up sanity check.

**Set expectations upfront for waits >90s**: Serverless/Standard first deploy 30–90s · **Stateful first deploy 2–5 min** · `force-redeployment` 30–90s · Volume set expand 30–60s · Large image push (1GB+) 1–5 min · Cold-path GVC + first workload 1–3 min · mk8s cluster 10–30+ min (background or skip).

## Workload types — choosing one

| Need | Use |
| --- | --- |
| Web app that should scale to zero when idle | `serverless` |
| Service that must always be running, multiple ports, or non-HTTP | `standard` |
| Background job on a schedule | `cron` |
| Database or stateful app needing persistent storage | `stateful` |

## Autoscaling strategies

| Strategy | Serverless | Standard | Stateful | Cron |
| --- | :-: | :-: | :-: | :-: |
| Concurrent Requests | Yes | No | No | No |
| Requests Per Second | Yes | Yes | Yes | No |
| CPU Utilization | Yes | Yes | Yes | No |
| Memory Utilization | Yes | Yes | Yes | No |
| Request Latency | No | Yes | Yes | No |
| Multi-metric (cpu/memory/rps) | No | Yes | Yes | No |
| KEDA (custom metrics) | No | Yes | Yes | No |

**Scale to zero** is ONLY for Serverless with `rps` or `concurrency`. Standard and Stateful can scale to zero only via KEDA. Cron cannot scale to zero. All other types require minScale ≥ 1.

| Strategy | Best for |
| --- | --- |
| Concurrent Requests | Request-driven services, APIs with variable concurrency |
| Requests Per Second | High-throughput APIs with predictable patterns |
| CPU Utilization | Compute-heavy workloads (image processing, ML inference) |
| Memory Utilization | Memory-intensive applications (caches, data processing) |
| Request Latency | Latency-sensitive services (real-time, interactive) |
| KEDA | Event-driven scaling (queue depth, external metrics) |
| Disabled | Fixed replica count, manually managed scaling |

## Workload resource validation — must-know constraints

| Constraint | Rule |
| --- | --- |
| CPU / memory minimum | 25 millicores / 32 MiB |
| Memory-to-CPU ratio | `memory(MiB) / cpu(millicores)` ≤ 8 (relax to 32 with tag `cpln/relaxMemoryToCpuRatio`) |
| `port` vs `ports` | Mutually exclusive on the same container; port numbers unique across all containers |
| Volumes | Max 15, unique paths, no path can be a parent of another |
| `target` ceiling | ≤ 100 with cpu/memory metrics; not allowed with KEDA |
| `metric`/`multi`/`target` | `metric` and `multi` are mutually exclusive; `target` is mutually exclusive with `multi` |
| `replicaDirect` LB | Stateful only |

**Defaults**: `type=serverless`, `cpu=50m`, `memory=128Mi`, `autoscaling.target=95`, `minScale=1`, `maxScale=5`, `scaleToZeroDelay=300s`, `terminationGracePeriodSeconds=90`, `firewallConfig.internal.inboundAllowType=none`.

For full validation (Stateful min/max ratios, GPU constraints — nvidia t4/a10g, container name reservations, probe XOR rules, health-check timing ranges), fetch [/reference/workload/general](https://docs.controlplane.com/reference/workload/general).

## Secrets — types and reference syntax

12 types: `opaque`, `dictionary`, `userpass`, `aws`, `gcp`, `azure-sdk`, `azure-connector`, `docker`, `ecr`, `tls`, `keypair`, `nats-account`. **`cpln secret create` does NOT exist** — use `create-opaque`, `create-aws`, etc.

Reference syntax in env vars / volumes:

| Type | Form |
| --- | --- |
| `opaque` | `cpln://secret/NAME.payload` |
| `dictionary` | `cpln://secret/NAME.KEY` (one env var per key, or mount as a directory) |
| `userpass` | `cpln://secret/NAME.username` / `.password` |
| `tls` | `cpln://secret/NAME.cert` / `.key` |
| `keypair` | `cpln://secret/NAME.publicKey` / `.privateKey` |
| `aws` | `cpln://secret/NAME.accessKey` / `.secretKey` / `.roleArn` |
| `gcp` | `cpln://secret/NAME` (typically a volume mount — JSON file) |

**Injection methods**: env var (`cpln://secret/NAME...`), volume mount (large/multi-file/GCP JSON), or **pull secret at GVC level** (`spec.pullSecretLinks` — `docker`, `ecr`, `gcp` types only).

## CLI essentials

### Setup

```bash
cpln login                                                  # interactive browser login
cpln profile update default --org my-org --gvc my-gvc       # set default org/GVC
```

For CI/CD, set environment variables through your platform's secrets management (never `--token`, which leaks into logs):

| Variable | Purpose |
| --- | --- |
| `CPLN_TOKEN` | Service account key (`cpln serviceaccount add-key`) |
| `CPLN_ORG` | Default organization |
| `CPLN_GVC` | Default GVC |
| `CPLN_PROFILE` | Profile override |

Override per command: `--org`, `--gvc`, `--profile`.

### The verification rule

**Never write a `cpln` command from memory.** Verify with `cpln <command> --help` or the MCP `cpln_suggest` tool. If a command is not in the resource command map below, assume it doesn't exist. Full conventions: https://docs.controlplane.com/cli-conventions.md

### Command structure

Resource commands: `cpln <resource> <action> [REF] [--flags]`. Standalone commands break this pattern: `cpln apply`, `cpln delete`, `cpln logs`, `cpln port-forward`, `cpln cp`, `cpln convert`, `cpln login`.

### Shared flags (on nearly every command)

- Context: `--profile`, `--org`, `--gvc`
- Output: `--output`/`-o` (`text`, `json`, `yaml`, `json-slim`, `yaml-slim`, `tf`, `crd`, `names`), `--max` (default 50)
- Request: `--token`, `--endpoint`, `--insecure`/`-k`
- Debug: `--verbose`/`-v`, `--debug`/`-d`

**Always use `-o yaml-slim` / `json-slim` for round-tripping.** Plain `yaml`/`json` include server-side fields (`status`, `id`, `created`, `lastModified`, `links`) that break `cpln apply`. Slim variants strip them.

### Resource command map

| Resource | Scope | CRUD | Non-standard subcommands |
| --- | --- | --- | --- |
| **workload** | gvc | Full | `connect`, `exec`, `run`, `cron` (get/run/start/stop), `replica` (get/stop), `force-redeployment`, `get-deployments`, `open`, `start`, `stop` |
| **gvc** | org | Full | `add-location`, `remove-location`, `delete-all-workloads` |
| **secret** | org | **No generic create** | 12 type-specific create commands, `reveal` |
| **policy** | org | Full | `add-binding`, `remove-binding` |
| **identity** | gvc | Full | — |
| **volumeset** | gvc | Full | `expand`, `shrink`, `snapshot` (create/delete/get/restore), `volume` (delete/get) |
| **domain** | org | Full (no clone) | — |
| **cloudaccount** | org | **No generic create** | `create-aws`, `create-azure`, `create-gcp`, `create-ngs` |
| **image** | org | No create | `build`, `copy`, `docker-login` |
| **agent** | org | Full (no clone) | `info`, `manifest`, `up` |
| **group** | org | Full | `add-member`, `remove-member` |
| **ipset** | org | Full | `add-location`, `remove-location`, `update-location` |
| **serviceaccount** | org | Full (no update) | `add-key`, `remove-key` |
| **mk8s** | org | **No create** | `dashboard`, `join`, `kubeconfig` |
| **user** | org | No create | `invite` |
| **org** | — | **No delete** (immutable) | — |
| **profile** | local | get, delete, update | `login`, `set-default`, `token` |
| **helm** | gvc | get | `install`, `upgrade`, `template`, `rollback`, `uninstall`, `list`, `history` |
| **stack** | gvc | — | `deploy`, `manifest`, `rm` |
| **location** | org | Partial | `install`, `uninstall` |
| **auditctx** | org | Full (no delete) | — |
| **quota** | org | get, edit, patch | — |

### Standard CRUD verbs

`get` (no args = list all — there is **NO `list` subcommand**), `get REF`, `create --name NAME`, `delete REF...`, `edit REF`, `patch REF --file FILE`, `update REF --set PROP=VAL`, `clone REF --name NEW`, `audit [REF]`, `query`, `tag REF --tag K=V`. Also: `access-report REF`, `eventlog REF`, `permissions`.

### Commands that DON'T exist

| Wrong | Correct |
| --- | --- |
| `cpln secret create` | `cpln secret create-opaque`, `create-aws`, etc. (12 type-specific variants) |
| `cpln <resource> list` | `cpln <resource> get` (no args = list all) |
| `cpln mk8s create` | `cpln apply --file mk8s-manifest.yaml` |
| `cpln logs --follow` | `cpln logs --tail` (or `-t` or `-f`) |
| `cpln workload log` | `cpln logs '{gvc="GVC", workload="WORKLOAD"}'` |
| `cpln cloudaccount create` | `cpln cloudaccount create-aws`, `create-azure`, `create-gcp`, `create-ngs` |
| `cpln apply` (no `--file`) | `cpln apply --file manifest.yaml` |
| `cpln workload update --identity X` | `cpln workload update REF --set spec.identityLink=//identity/X` |
| `cpln secret update --data '{}'` | `cpln secret edit REF` or `cpln apply --file ...` |
| `cpln gvc update --location LOC` | `cpln gvc update REF --set 'spec.staticPlacement.locationLinks+=//location/LOC'` |
| `cpln image push` / `cpln image pull` | `cpln image build --push` (build+push) or `docker push` after `cpln image docker-login` |
| `cpln image tag` for version tags | Use Docker version tags directly via `cpln image build --name NAME:TAG`. `cpln image tag` exists but manages **metadata** key=value tags only, NOT Docker version tags. |
| `cpln workload create --type stateful/cron` | `cpln apply --file workload.yaml` — CLI flags only support serverless/standard create |

### High-value command shapes

The resource command map + Standard CRUD verbs cover most cases. These are the syntax-sensitive ones worth memorizing:

| Task | Command |
| --- | --- |
| Apply / delete bundle | `cpln apply --file ./manifests/ --gvc GVC --ready` &nbsp;·&nbsp; `cpln delete --file manifest.yaml` |
| Create workload (cron/stateful via apply, not CLI flags) | `cpln workload create --name APP --gvc GVC --image IMAGE --port PORT` |
| Create opaque secret | `cpln secret create-opaque --name SECRET --file data.txt` (use `--file -` for stdin) |
| Bind permission | `cpln policy add-binding POLICY --permission reveal --identity //gvc/GVC/identity/ID` |
| Assign identity to workload | `cpln workload update WL --gvc GVC --set spec.identityLink=//identity/ID` |
| View logs | `cpln logs '{gvc="GVC", workload="WL"}' --org ORG --tail` |
| Exec in container (note `--` separator) | `cpln workload exec WL --gvc GVC -- COMMAND` |
| Port forward | `cpln port-forward WL 8080:8080 --gvc GVC` |
| Export for re-apply | `cpln workload get WL --gvc GVC -o yaml-slim > wl.yaml` |
| Rename (preferred over get/edit/apply) | `cpln workload clone OLD --name NEW --gvc GVC` |
| Build & push image | `cpln image build --name IMAGE:TAG --push` |
| Convert K8s manifests | `cpln convert --file k8s-manifest.yaml` |

## Manifest patterns

### Resource shapes

Not all resources use `spec`. Top-level fields differ by kind: workload/gvc/identity/volumeset use `spec`; secret uses `type` + `data`; policy uses `targetKind` + `targetLinks` + `bindings`.

```yaml
kind: workload
name: my-app
spec:
  type: serverless
  containers:
    - name: main
      image: nginx:latest                              # exact ref, NO docker.io/ prefix
      port: 80
      memory: 256Mi
      cpu: 250m
      env:
        - name: DB_PASSWORD
          value: cpln://secret/db-password.payload     # opaque → .payload
  defaultOptions:
    autoscaling: { minScale: 1, maxScale: 5, metric: rps, target: 100 }
  firewallConfig:
    external:
      inboundAllowCIDR: ["0.0.0.0/0"]
      outboundAllowCIDR: ["0.0.0.0/0"]
---
kind: secret
name: db-password
type: opaque
data: { encoding: plain, payload: my-secret-value }
---
kind: policy
name: secret-access
targetKind: secret                                     # singular, lowercase
targetLinks: [//secret/db-password]
bindings:
  - permissions: [reveal]
    principalLinks: [//gvc/my-gvc/identity/my-app-identity]    # GVC-scoped principal link
---
kind: identity
name: my-app-identity
```

For full validation rules per resource (workload validation, GPU constraints, identity XOR rules, domain DNS modes, volume set autoscaling), fetch the matching reference page in the **Resources** section at the end of this skill.

### Multi-resource apply — single call, not many

`cpln apply` walks the inter-resource dependency graph when given a directory or multi-doc YAML. **Splitting into multiple `apply` calls reintroduces the ordering problem apply was built to solve** (workloads referencing secrets not yet applied, etc.).

- **Single-GVC bundle** (most common): pass `--gvc <gvc>` once. It fills the GVC for every GVC-scoped resource in the bundle that doesn't declare one inline.
- **Per-resource GVC declaration** (resources span multiple GVCs, or manifests must be self-describing): declare a top-level `gvc:` field on each GVC-scoped resource (same level as `kind`/`name`). Apply **without** `--gvc`; apply routes each resource to its declared GVC.

Org-scoped resources (`secret`, `policy`, `domain`, `image`, `agent`, `group`, `cloudaccount`, `serviceaccount`, `ipset`, `mk8s`) ignore the `gvc` field/flag. Single-resource applies are for incremental updates to one existing resource, not initial multi-resource deploys.

## Workflows

### Grant a workload access to a secret

The 3-step rule (guardrail #2) as commands:

```bash
# 1. Secret (file-based; --file - for stdin)
cpln secret create-opaque --name db-password --file ./db-password.txt

# 2. Identity, assigned to the workload
cpln identity create --name my-app-identity --gvc my-gvc
cpln workload update my-app --gvc my-gvc \
  --set spec.identityLink=//identity/my-app-identity

# 3. Policy with reveal, then inject the secret reference.
#    Replace <container-name> with the actual container (look up via -o yaml-slim).
#    Opaque uses .payload; dictionary uses .KEY; userpass uses .username/.password; tls .cert/.key.
cpln policy create --name secret-access --target-kind secret --resource db-password
cpln policy add-binding secret-access \
  --permission reveal \
  --identity //gvc/my-gvc/identity/my-app-identity
cpln workload update my-app --gvc my-gvc \
  --set spec.containers.<container-name>.env.DB_PASSWORD.value=cpln://secret/db-password.payload
```

For a bundle: put all four resources in one multi-doc file and `cpln apply --file bundle.yaml --gvc my-gvc --ready`. Apply resolves the dependencies.

### GitOps with cpln apply

```bash
cpln gvc get my-gvc -o yaml-slim > manifests/gvc.yaml         # always yaml-slim
cpln workload get my-app --gvc my-gvc -o yaml-slim > manifests/workload.yaml
# edit, commit, then in CI:
cpln apply --file ./manifests/ --gvc my-gvc --ready           # one call; apply resolves order
```

### Debug a failing workload

```bash
cpln workload get-deployments my-app --gvc my-gvc                  # exact failure reason
cpln logs '{gvc="my-gvc", workload="my-app"}' --org my-org --tail  # stderr/stdout
cpln workload exec my-app --gvc my-gvc -- env | grep CPLN          # check injected env
cpln workload connect my-app --gvc my-gvc                          # interactive shell
cpln port-forward my-app 8080:8080 --gvc my-gvc                    # local access
```

For Terraform / Pulumi / Kubernetes Operator deployment patterns, fetch the relevant doc page (see Resources at end of this skill).

## Networking and load balancers

**Firewall defaults** (covered in guardrail #4): internal `none`, external inbound and outbound disabled. Blocked > allowed; CIDR > hostname; hostname egress = ports 80/443/445 only (override with `outboundAllowPort`); hostnames support `*.example.com` wildcards.

**Endpoints:**

- Internal DNS (same-GVC): `WORKLOAD.GVC.cpln.local:PORT`
- Public canonical (set by GVC `endpointNamingFormat`):
  - `org` (default for new GVCs): `{workload}-{gvcAlias}.{orgEndpointPrefix}.cpln.app`
  - `default`: `{workload}-{gvcAlias}.cpln.app`
  - `legacy`: legacy scheme
- `gvcAlias` is auto-generated and may differ from the GVC name. Look up exact: `cpln workload get WL --gvc GVC -o json | jq -r '.status.endpoint'`. Container also receives `CPLN_GLOBAL_ENDPOINT` env var.
- Location IDs: `aws-us-east-1`, `gcp-us-central1`, `azure-eastus`
- Internal traffic is auto-mTLS. Every workload gets a `CPLN_TOKEN` env var (auto-rotated JWT, valid only from inside that workload).
- **Serverless `Host` header is the canonical endpoint, not the custom domain.** Original is in `X-Forwarded-Host`. Standard/Stateful receive the custom domain as `Host`.

**Load balancers:**

| Type | Scope | Custom ports | Static IPs | Workload type |
| --- | --- | :-: | :-: | --- |
| Default (shared) | All workloads | No | No | All |
| Direct | Per-workload | Yes (TCP/UDP) | Via IP Sets | All |
| Dedicated (GVC) | Per-GVC | Yes | Via IP Sets | All |
| Replica Direct (`spec.loadBalancer.replicaDirect`) | Per-replica | Configurable | Via IP Sets | **Stateful only** |

Dedicated LB on the GVC (`spec.loadBalancer.dedicated: true`) unlocks: domain ports outside 443/80, wildcard hostnames, `redirect.class.status5xx`/`status401` rules, and `tcp` protocol on domains. `trustedProxies`: `0` (source IP), `1` (last `X-Forwarded-For`), `2` (second-to-last).

## Policies

Bind principals to permissions on resources. Wrong target kind, link format, or permission name all silently fail.

- **`targetKind`** is singular and lowercase. Valid: `account`, `agent`, `auditctx`, `cloudaccount`, `domain`, `group`, `gvc`, `identity`, `image`, `location`, `org`, `policy`, `quota`, `secret`, `serviceaccount`, `task`, `user`, `volumeset`, `workload`. **NOT** valid (controlled via parent): `ipset`, `mk8s`, `workloadreplica`.
- **Target scope** — pick exactly one: `target: all` | `targetLinks: [...]` | `targetQuery: {spec: {match, terms}}`.
- **Target link by scope**: org-scoped `//KIND/NAME`, GVC `//gvc/NAME`, GVC-scoped `//gvc/GVC/KIND/NAME`, user `//user/EMAIL`.
- **Principal links**: user `//user/EMAIL`, service account `//serviceaccount/NAME`, group `//group/NAME`, **identity `//gvc/GVC/identity/NAME`** (NEVER `//identity/NAME` — silent ignore).
- Max 50 bindings per policy, 200 principal links per binding. Permissions in each binding must be sorted alphabetically and unique. Built-in policies (`origin: builtin`) cannot be modified or deleted.

For full per-kind permissions table (and what `reveal`, `use`, `manage`, etc. actually grant), use `cpln policy permissions`, the MCP `mcp__cpln__get_permissions` tool, or fetch [/reference/policy](https://docs.controlplane.com/reference/policy).

## Identities

GVC-scoped. Assign via `--set spec.identityLink=//identity/NAME`. One identity per workload; an identity can be shared across workloads in the same GVC. **One cloud account per provider per identity** (one AWS + one GCP + one Azure — not two AWS). Identities cannot be shared across GVCs — recreate per GVC.

Provider sections each have XOR rules (e.g. AWS `roleName` ⊻ `policyRefs`; GCP `serviceAccount` ⊻ `bindings`). Network resources: `IPs` ⊻ `FQDN`. Native network resources: `awsPrivateLink` ⊻ `gcpServiceConnect`. Max 50 of each. For full XOR rules and provider-specific fields, fetch [/reference/identity](https://docs.controlplane.com/reference/identity).

## Domains

| Field | Rule |
| --- | --- |
| `dnsMode` | `cname` or `ns`. **Apex domains MUST use `cname`** — NS doesn't support apex. |
| `certChallengeType` | `http01` or `dns01`. **NS mode requires `dns01`** (`http01` rejected). |
| `gvcLink` ⊻ `workloadLink` ⊻ `ports.routes` | Mutually exclusive. `workloadLink` (replica-direct) is Stateful only. |
| `acceptAllHosts` ⊻ `acceptAllSubdomains` | Mutually exclusive; both require dedicated LB. |
| `ports[].protocol` | `http`, `http2` (default), `tcp` (`tcp` requires dedicated LB). |
| Route scope | All routes in a domain must target workloads in the **same GVC**. |

CNAME records → `cpln.app`. NS records → `ns1.cpln.cloud`, `ns2.cpln.cloud`, `ns1.cpln.live`, `ns2.cpln.live`. Auto-TLS = Let's Encrypt, valid 90 days, auto-renewed every 60. Custom certs use the `keypair` secret type with PEM content. For CORS, header wildcards, route limits, and full route schema, fetch [/reference/domain](https://docs.controlplane.com/reference/domain).

## Volume sets

Stateful only. Mount via `cpln://volumeset/NAME` with `recoveryPolicy: retain` (default) or `recycle`.

| Filesystem | Access | Binding | Snapshots / shrink / delete / restore |
| --- | --- | --- | :-: |
| `ext4` | RWO | 1 stateful workload | Yes |
| `xfs` | RWO | 1 stateful workload | Yes |
| `shared` | RWX | Any number of workloads | **No** |

Performance classes: `general-purpose-ssd` (min 10 GB), `high-throughput-ssd` (**min 200 GB**), `shared` (auto-set when `fileSystemType: shared`). Max capacity 65,536 GB for all.

- **Both `fileSystemType` AND `performanceClass` are immutable.** Changing either = delete + recreate (data loss — guardrail #6).
- `shrinkVolume` destroys data; volumes can be expanded only once every 6 hours.
- `createFinalSnapshot: true` (default) auto-snapshots before any volume deletion — leave on.

For autoscaling, predictive scaling, mount options on `shared`, and AWS KMS custom encryption, fetch [/reference/volumeset](https://docs.controlplane.com/reference/volumeset).

## Boundaries — Console-only actions

CLI / API / Terraform handle nearly everything (resource CRUD, image push, domain config, debugging, template install). **Console-only**: managing billing and payment methods, creating the initial billing account, viewing Grafana metrics dashboards (link from Console).

## Logs and observability

```bash
cpln logs '{gvc="GVC", workload="WL"}' --org ORG --tail
```

- **LogQL labels**: `gvc`, `workload`, `container`, `location`, `provider`, `replica`, `stream`. Special: `container="_accesslog"` for HTTP access logs.
- **Filters inside the query** (NOT shell pipes): `|= "error"` (contains), `!= "debug"` (excludes), `|~ "timeout|crash"` (regex).
- **Streaming**: `--tail` / `-t` / `-f` (`--follow` does NOT exist).
- **`--gvc` is NOT a flag here** — GVC goes inside the LogQL query.
- Range flags: `--since "1h"`, `--from`, `--to` (ISO 8601, duration, or `now-<duration>`); `--limit N` (default 30, `0` = unlimited).
- **Cron logs**: each run is a separate replica. Enumerate runs via `cpln workload get-deployments NAME --gvc GVC -o json` → `status.jobExecutions[]`, then scope logs by the `replica` label and run's time window.

## Operational notes

- **Don't set `spec.identityLink` unless needed** — only when the workload requires secret / cloud / network access. Empty identityLink complicates debugging and audit traces.
- **Service account keys (not user tokens) in CI/CD.** Generate with `cpln serviceaccount add-key`. User tokens belong to a person who may leave the team.
- **Billing roles are independent from org permissions.** `billing_admin` / `billing_viewer` / `org_creator` have zero implicit permissions on org resources.
- **Readiness probes** default to TCP-on-port for Serverless, **disabled** for Standard / Stateful / Cron — configure explicitly or `--ready` may hang on first-deploy (guardrail #8).
- **Apple Silicon**: `cpln image build --push` defaults to `linux/amd64` — verify with `cpln image get`. Wrong platform = runtime `exec format error`.

## Verification checklist

Before submitting:

- [ ] All 8 guardrails honored (org confirmed · 3-step secret access with `cpln://secret/NAME.FIELD` · image refs correct · firewall configured · workload type fits · destructive ops confirmed · constraint conflicts surfaced · waits via CLI/shell, not AI polling)
- [ ] `-o yaml-slim` used for re-apply; **one** `cpln apply` for multi-resource bundles
- [ ] Identity assigned only if the workload actually needs secret / cloud / network access
- [ ] Memory:CPU ≤ 8 (or `cpln/relaxMemoryToCpuRatio` tag set)
- [ ] Policy `targetKind` singular/lowercase; identity principal links use `//gvc/GVC/identity/NAME` (not `//identity/NAME`)
- [ ] Service account keys (not user tokens) in CI/CD

## Resources

**Always-relevant alongside this skill:**

- [llms.txt](https://docs.controlplane.com/llms.txt) — comprehensive page index for AI agents
- [cli-conventions.md](https://docs.controlplane.com/cli-conventions.md) — full CLI structure, shared flags, resource command map

**Fetch when authoring manifests for that resource:**

- [/reference/workload/general](https://docs.controlplane.com/reference/workload/general), [/types](https://docs.controlplane.com/reference/workload/types), [/autoscaling](https://docs.controlplane.com/reference/workload/autoscaling), [/capacity](https://docs.controlplane.com/reference/workload/capacity), [/firewall](https://docs.controlplane.com/reference/workload/firewall)
- [/reference/secret](https://docs.controlplane.com/reference/secret), [/reference/policy](https://docs.controlplane.com/reference/policy), [/reference/identity](https://docs.controlplane.com/reference/identity)
- [/reference/domain](https://docs.controlplane.com/reference/domain), [/reference/volumeset](https://docs.controlplane.com/reference/volumeset), [/reference/gvc](https://docs.controlplane.com/reference/gvc)

**Fetch for end-to-end workflows:**

- [/guides/cpln-apply](https://docs.controlplane.com/guides/cpln-apply) — GitOps, multi-resource apply, the patience-windowed safety-net pattern
- [/cli-reference/overview](https://docs.controlplane.com/cli-reference/overview) — all CLI commands and flags
- [/mcp/overview](https://docs.controlplane.com/mcp/overview), [/mcp/ai-plugin](https://docs.controlplane.com/mcp/ai-plugin) — MCP Server (80+ tools) and full AI plugin (skills + agents + commands + guardrails)
- [/template-catalog/overview](https://docs.controlplane.com/template-catalog/overview) — 30+ production-ready templates
- [/mk8s/overview](https://docs.controlplane.com/mk8s/overview), [/byok/overview](https://docs.controlplane.com/byok/overview), [/core/kubernetes-operator](https://docs.controlplane.com/core/kubernetes-operator)
- Terraform: [registry.terraform.io/providers/controlplane-com/cpln](https://registry.terraform.io/providers/controlplane-com/cpln/latest/docs)
