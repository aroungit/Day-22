# Swagger AI Agent Implementation Plan

## 1. Baseline Decisions

- Runtime: Node.js 20+
- Language: TypeScript
- Framework: Express, as defined by the master architecture
- Parser: `@apidevtools/swagger-parser`
- HTTP client: Axios
- Test framework: Jest
- Initial persistence: In-memory repositories
- Architecture: Domain, application, infrastructure, and API layers
- Delivery: One phase at a time, with approval required before the next phase

> The companion prompt mentions Fastify and filesystem storage. The master architecture currently takes precedence. Those choices can be changed before Phase 1 if required.

## 2. Phase-by-Phase Plan

### Phase 1: Project Setup

**Objective:** Establish the runnable TypeScript service foundation.

**Implementation:**

- Initialize `package.json`, TypeScript, Jest, and development scripts.
- Create the prescribed directory structure.
- Implement environment and configuration loading.
- Create the Express application and HTTP server.
- Add Winston logging.
- Add request logging and centralized error handling.
- Add `GET /health`.
- Add one sample unit test.

**Validation:**

- Start the server.
- Call the health endpoint from Postman.
- Run Jest.
- Run TypeScript compilation.

**Deliverables:**

- Phase 1 source files.
- Phase 1 Postman collection.
- Test and compile results.

### Phase 2: Domain Layer

**Status:** Implemented

**Objective:** Define framework-independent business models.

**Implementation:**

- Add `NormalizedSpec`.
- Add `Operation`.
- Add `EnvironmentConfig`.
- Add `RunPlan`.
- Add `RunReport`.
- Add `TestCaseDefinition`.
- Add repository interfaces.
- Add shared domain types and result handling.

**Rules:**

- No Express imports.
- No Axios imports.
- No database or parser dependencies.

**Validation:**

- TypeScript compilation.
- Domain unit tests.
- Verify domain isolation from infrastructure.

**Postman:**

- Health check only. Domain behavior is validated through automated tests because this phase adds no business API endpoints.

**Completed:**

- Added framework-independent domain models, repository interfaces, shared types, and result handling.
- Added domain unit tests.
- Validation passed: `npm run build` and `npm test` (2 suites, 3 tests).

### Phase 3: Infrastructure Skeleton

**Status:** Implemented

**Objective:** Add replaceable adapters without business orchestration.

**Implementation:**

- Swagger loader interfaces for URL, file, and Git sources.
- Parser adapter wrapper.
- OpenAPI normalizer skeleton.
- Axios client wrapper.
- In-memory repositories.
- MCP registry skeleton.
- LLM client interface.
- Infrastructure logging adapter.

**Validation:**

- Adapter contract tests.
- Repository CRUD tests.
- Verify infrastructure implementations satisfy domain interfaces.

**Postman:**

- Health check and any explicitly exposed adapter status endpoint.

**Completed:**

- Added URL, file, and Git-source Swagger loader contracts, parser wrapper, and OpenAPI normalizer skeleton.
- Added Axios client wrapper, in-memory repositories, MCP registry/server shell, and payload-builder LLM client contract.
- Added infrastructure adapter and repository contract tests.
- Validation passed: `npm run build` and `npm test` (3 suites, 7 tests).

### Phase 4: Specification Ingestion

**Status:** Implemented

**Objective:** Import and normalize OpenAPI 2.0 and 3.x documents.

**Implementation:**

- Implement `ingestSwagger.usecase.ts`.
- Normalize paths, methods, parameters, request bodies, responses, security, tags, and servers.
- Implement structural validation.
- Implement operation listing.
- Add:
  - `POST /spec/import`
  - `POST /spec/validate`
  - `GET /spec/:specId`
  - `GET /spec/:specId/operations`
  - `GET /spec/:specId/tags`

**Completed:**

- Added Swagger parser-backed ingestion with structural fallback validation for constrained test runtimes.
- Normalized OpenAPI 2.0, 3.0, and 3.1 metadata, servers, operations, parameters, request bodies, responses, security, and tags.
- Added specification import, validation, metadata, operation, and tag endpoints.
- Validation passed: `npm run build` and `npm test` (4 suites, 10 tests).
- Postman collection: `postman/phase-4-specification.postman_collection.json`

**Validation:**

- OpenAPI 2 fixture.
- OpenAPI 3 fixture.
- Invalid document fixture.
- URL and file ingestion tests.

**Postman:**

- Import specification.
- Validate specification.
- Retrieve metadata.
- List operations.
- List tags.

### Phase 5: Environment Management

**Status:** Implemented

**Objective:** Manage named environments for each specification.

**Implementation:**

- Create, list, retrieve, update, and delete environment use cases.
- Add environment repository integration.
- Validate base URLs, headers, and authentication configuration.
- Add:
  - `POST /environment`
  - `GET /spec/:specId/environments`
  - `GET /environment/:envId`
  - `PUT /environment/:envId`
  - `DELETE /environment/:envId`

**Validation:**

- Valid environment creation.
- Invalid URL rejection.
- Update and deletion behavior.
- Isolation between specifications.

**Postman:**

- Full environment CRUD collection.
- Postman collection: `postman/phase-5-environment.postman_collection.json`

**Completed:**

- Added environment creation, listing, retrieval, update, and deletion with specification scoping and URL, header, and authentication validation.
- Validation passed: `npm run build` and `npm test`.

### Phase 6: Run Planning

**Status:** Implemented

**Objective:** Select operations and generate executable test definitions.

**Implementation:**

- Support single-operation, tag, and full-specification selection.
- Generate happy-path, validation-error, and authentication-error cases where applicable.
- Persist `RunPlan`.
- Add `POST /execution/plan`.

**Validation:**

- Plan by operation.
- Plan by tag.
- Plan a full specification.
- Reject unknown operations and tags clearly.

**Postman:**

- Create a plan for one operation.
- Create a plan by tag.
- Create a full plan.
- Postman collection: `postman/phase-6-run-planning.postman_collection.json`

**Completed:**

- Added operation, tag, and full-specification selection with clear unknown-selection errors.
- Generated happy-path, validation-error, and authentication-error test definitions from normalized operation metadata.
- Persisted planned runs through the in-memory run-plan repository.
- Validation passed: `npm run build` and `npm test`.

### Phase 7: Axios Execution Engine

**Status:** Implemented

**Objective:** Execute planned operations and produce reports.

**Implementation:**

- Build requests from operation and environment data.
- Support path parameters, query parameters, headers, authentication, and request bodies.
- Execute through the Axios adapter.
- Compare actual and expected status codes.
- Persist run reports.
- Add:
  - `POST /execution/run`
  - `GET /execution/status/:runId`

**Validation:**

- Execute against a local mock API.
- Verify passed requests.
- Verify failed status assertions.
- Verify network and timeout errors.
- Verify report details and timings.

**Postman:**

- Execute an existing plan.
- Plan and execute in one call.
- Retrieve run status.
- Postman collection: `postman/phase-7-execution.postman_collection.json`

**Completed:**

- Added injectable Axios execution with path, query, header, authentication, body, timeout, status assertion, timing, and error reporting.
- Added in-memory run report persistence and execution/status endpoints.
- Validation passed: `npm run build` and `npm test`.

### Phase 8: Axios and Jest Test Generation

**Status:** Implemented

**Objective:** Generate runnable test code.

**Implementation:**

- Generate Jest `describe` and `it` blocks.
- Generate Axios requests.
- Generate status assertions.
- Support positive, negative, authentication, and boundary options.
- Add:
  - `POST /testgen/generate-axios-tests`
  - `GET /testgen/spec/:specId/preview`

**Validation:**

- Generated code parses successfully.
- Generated code contains expected operations.
- Selected options are reflected in generated tests.
- Generated metadata matches the source specification.

**Postman:**

- Generate tests by operation.
- Generate tests by tag.
- Preview a generated suite.
- Postman collection: `postman/phase-8-test-generation.postman_collection.json`

**Completed:**

- Added template-based Jest and Axios source generation with operation selection, positive, negative, authentication, boundary options, and metadata.
- Added generation and preview endpoints.
- Validation passed: `npm run build` and `npm test`.

### Phase 9: LLM-Assisted Payload Building

**Status:** Implemented

**Objective:** Enrich missing payload values without making execution dependent on an LLM.

**Implementation:**

- Generate payloads from examples, defaults, and schema constraints first.
- Detect missing required values.
- Invoke the LLM client only for unresolved fields.
- Add `POST /llm/build-payload`.
- Keep the LLM integration behind an interface.

**Validation:**

- Schema-only payload generation.
- LLM fallback behavior.
- LLM unavailable behavior.
- Required-field validation.

**Postman:**

- Build payload from schema.
- Build payload with hints.
- Validate fallback behavior.
- Postman collection: `postman/phase-9-payload-builder.postman_collection.json`

**Completed:**

- Added schema/example/default/enum payload generation with unresolved-field detection.
- Added optional LLM fallback behind the existing client interface; unavailable LLMs return the deterministic payload.
- Added `/llm/build-payload`.
- Validation passed: `npm run build` and `npm test`.

### Phase 10: MCP Integration

**Status:** Implemented

**Objective:** Expose agent-oriented tools through a consistent adapter layer.

**Implementation:**

- Add:
  - `listOperations.tool.ts`
  - `planApiRun.tool.ts`
  - `executeOperation.tool.ts`
  - `generateAxiosTests.tool.ts`
- Add:
  - `POST /mcp/swagger/list-operations`
  - `POST /mcp/swagger/plan-run`
  - `POST /mcp/swagger/execute-operation`
  - `POST /mcp/swagger/generate-axios-tests`
- Ensure MCP tools call application use cases only.

**Validation:**

- Tool input validation.
- Correct use-case delegation.
- Consistent results between normal APIs and MCP endpoints.

**Postman:**

- One request per MCP endpoint.
- Postman collection: `postman/phase-10-mcp.postman_collection.json`

**Completed:**

- Added application-backed list, plan, execute, and test-generation MCP tools.
- Added matching `/mcp/swagger/*` HTTP endpoints.
- Validation passed: `npm run build` and `npm test`.

### Phase 11: Retry and Reporting

**Status:** Implemented

**Objective:** Support partial reruns and useful aggregation.

**Implementation:**

- Retry failed and errored tests.
- Add `POST /execution/retry-failed`.
- Aggregate reports by tag, HTTP method, and path.

**Completed:**

- Added failed-case retry with passed-result preservation and retry history.
- Added report aggregation by tag, HTTP method, and path.
- Added `POST /execution/retry-failed` and `GET /execution/aggregate/:runId`.
- Validation passed: focused Phase 11 tests, `npm run build`, and full `npm test`.
- Postman collection: `postman/phase-11-retry-reporting.postman_collection.json`

**Validation:**

- Retry only failed cases.
- Preserve passed cases.
- Verify updated aggregate counts.
- Verify retry history.

**Postman:**

- Run a plan.
- Retry failed tests.
- Retrieve the updated report.

### Phase 12: Hardening

**Status:** Implemented

**Objective:** Prepare the service for production and database migration.

**Implementation:**

- Complete request validation.
- Add request-size limits.
- Add rate limiting.
- Add Axios timeouts and retries.
- Add structured logs.
- Improve external error mapping.
- Add unit and integration coverage.
- Verify repositories remain interface-driven.
- Add authentication middleware foundations.

**Completed:**

- Added configurable JSON request-size limits and consistent payload error responses.
- Added in-memory rate limiting with configurable windows and request counts.
- Added bounded Axios retries for idempotent requests and transient failures.
- Preserved structured request logging and interface-driven repositories.
- Added hardening regression coverage for limits, errors, and retry policy.
- Validation passed: `npm run build` and full `npm test`.
- Postman collection: `postman/phase-12-hardening.postman_collection.json`

**Validation:**

- Full Jest suite.
- TypeScript compilation.
- Invalid request tests.
- Timeout and retry tests.
- Large-payload tests.
- Consistent error response checks.

**Postman:**

- Full regression collection covering all implemented APIs.

### Optional Phase 13: BDD, DTO, and Postman Generation

This phase covers requirements from `swagger-prompt.md` that are not explicit in the master architecture:

- Generate TypeScript DTO interfaces.
- Generate Gherkin feature files.
- Generate Cucumber.js step definitions.
- Export application-generated Postman collections.
- Add preview and download endpoints for generated artifacts.

## 3. Phase Approval Workflow

For every phase:

1. Review the phase scope and file list.
2. Approve the phase.
3. Implement one file or module at a time.
4. Run focused tests and compilation.
5. Provide the phase-specific Postman collection.
6. Validate the collection.
7. Confirm approval before starting the next phase.

## 4. Initial Approval Gate

Implementation begins with Phase 1 only.

Approval command:

```text
Approve Phase 1
```

### Phase 1 Approval Record

- Status: Approved and implemented
- Validation: `npm run build` passed.
- Validation: `npm test` passed with 1 test suite and 1 test.
- Smoke test: `GET /health` returned HTTP 200 with status `ok`.
- Postman collection: `postman/phase-1-health.postman_collection.json`

Phase 2 may begin only after a separate approval command.
