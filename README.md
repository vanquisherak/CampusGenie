# CampusGenie

CampusGenie is a curriculum-aware academic assistant designed around a closed learning loop: understand the learner state, retrieve curriculum evidence, coordinate specialized agents, verify the response, and update the next learning action from observed outcomes.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The first screen runs without external credentials and uses seeded learner and evidence data.

Useful checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Architecture

The detailed layered architecture, production topology, request workflow, security baseline, and technology decisions are in [docs/architecture.md](docs/architecture.md).

```text
app/page.tsx                         Dashboard and learner workflow
app/api/assistant/route.ts           Typed assistant response boundary
lib/curriculum/types.ts              Curriculum graph and learner-state contracts
lib/rag/contracts.ts                 Retrieval and evidence contracts
lib/ai/contracts.ts                  Agent routing and response contracts
lib/mcp/contracts.ts                 Permission-aware institutional tool contracts
lib/demo-data.ts                     Seed learner state and provenance examples
```

The current API route is intentionally deterministic. The next implementation phase can replace it with a provider adapter without changing the UI contract.

## Agentic AI mode

The assistant route now runs a multi-step agent workflow: intent classification, learner-context resolution, curriculum mapping, prerequisite expansion, evidence retrieval, response generation, and evidence verification. CampusGenie uses Gemini Interactions when `GEMINI_API_KEY` is configured:

```env
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-3.8-flash
```

The older OpenAI-compatible variables remain supported as a fallback. Never expose a key in client code or commit `.env.local`.

The institutional reference connector is modeled after the public CU-LMS gateway: course context is expected to arrive through CUIMS/institutional SSO, while LMS resources are accessed through a least-privilege MCP gateway. Do not place portal session keys, cookies, or password values in source code or `.env` files committed to the repository.

## Development phases

1. Replace demo retrieval with hybrid vector, keyword, and curriculum-graph retrieval.
2. Implement the learner-state update service with evidence-linked mastery changes.
3. Add agents for explanation, quiz generation, study planning, and project recommendations.
4. Add MCP gateways for library, LMS, project, and advising systems with read/write permissions and action receipts.
5. Add verification gates for citation support, curriculum alignment, academic integrity, and tool authorization.
6. Evaluate against search, generic chatbot, and RAG-only baselines.

The attached system design is implemented as the source of truth for these phases. The current UI remains Next.js for a fast MVP; FastAPI is the planned orchestration boundary once the first real institutional connector is introduced.

## Evaluation model

Track response accuracy, citation support, curriculum alignment, hallucination rate, user satisfaction, task completion rate, time to completion, interaction turns, and pre/post learning improvement. Log the evidence, agent path, tool calls, and outcome that caused each learner-state update.

## Patent-oriented novelty boundary

The product should not claim the broad idea of an educational chatbot or RAG system. The potentially differentiating technical combination is a permission-aware agent planner that jointly uses curriculum prerequisites, learner mastery uncertainty, evidence provenance, institutional tool availability, and post-response learning outcomes to select retrieval depth, agent sequence, and next learning action.

Before public disclosure or filing, perform a prior-art search and obtain advice from a qualified patent professional. This repository is a technical prototype, not a patentability opinion.