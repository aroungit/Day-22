# Swagger AI Agent Frontend Plan

## Approval Gate

This plan must be approved before frontend implementation begins.

**Approval status:** Approved on 2026-09-14

**Scope:** Build a standalone React/Vite frontend in a new `web-app/` directory. Existing backend source, routes, domain logic, configuration, tests, and behavior remain unchanged.

## Objectives

- Create a modern, responsive, accessible business-analyst UI for the Swagger AI Agent.
- Consume the existing Express API through a typed Axios client.
- Support the workflows already exposed by the backend: specification import and inspection, environment management, run planning and execution, reports, retry, test generation, and payload building.
- Preserve the theme selector with `Light`, `Dark`, and `System` options, persisted locally.
- Keep backend functionality and logic unchanged. Any backend contract gap is documented rather than patched during frontend work.

## Existing API Boundary

The frontend may call these existing endpoints under `/api`:

- `GET /health`
- `POST /spec/import`
- `POST /spec/validate`
- `GET /spec/:specId`
- `GET /spec/:specId/operations`
- `GET /spec/:specId/tags`
- `POST /environment`
- `GET /spec/:specId/environments`
- `GET /environment/:envId`
- `PUT /environment/:envId`
- `DELETE /environment/:envId`
- `POST /execution/plan`
- `POST /execution/run`
- `GET /execution/status/:runId`
- `POST /execution/retry-failed`
- `GET /execution/aggregate/:runId`
- `POST /testgen/generate-axios-tests`
- `GET /testgen/spec/:specId/preview`
- `POST /llm/build-payload`

The current backend does not expose a spec collection endpoint, spec deletion endpoint, or run-history collection endpoint. The frontend will not add or alter these routes. The initial UI will use imported/current spec context and stored run IDs, and will clearly represent unavailable collection data rather than inventing backend behavior.

## Technology and Structure

Create a self-contained `web-app/` Vite project using:

- React 18 and TypeScript with strict mode
- React Router v6
- Zustand for client state
- Axios with request/response handling
- Tailwind CSS with accessible shadcn-style primitives
- Lucide React icons
- Framer Motion for restrained transitions
- React Hook Form and Zod for forms
- Recharts for report visualizations
- Vitest and React Testing Library for focused component tests
- Playwright for final browser validation

The frontend will have its own `package.json`, scripts, environment files, and build configuration. It will proxy `/api` to the existing backend during local development without changing the backend.

## Delivery Phases

### Phase 0: Baseline and Guardrails

**Work**

- Capture current backend build and test status.
- Confirm the backend route contract above.
- Create the frontend workspace and API base URL configuration.
- Add a frontend-only development proxy.
- Add a backend protection note/check so frontend edits cannot silently modify `src/` behavior.

**Validation**

- Existing `npm run build` and `npm test` remain green.
- Frontend scaffold builds independently.

### Phase 1: App Shell and Design System

**Work**

- Add responsive shell with sidebar, header, breadcrumbs, mobile navigation, skip link, and main content area.
- Add dashboard landing route and placeholder states for each supported workflow.
- Establish a purposeful visual system: readable display and body typography, blue action color, distinct success/error/warning colors, compact data surfaces, and responsive spacing.
- Add accessible primitives for buttons, inputs, badges, dialogs, tabs, selects, tables, empty states, loading states, and toasts.
- Implement the `Light` / `Dark` / `System` theme selector with localStorage persistence and system preference detection.

**Validation**

- Keyboard navigation and focus visibility.
- Responsive shell at mobile and desktop widths.
- Theme persistence and system-theme behavior.

### Phase 2: Typed API Client and State

**Work**

- Add DTOs matching the existing domain response shapes.
- Add Axios client with configurable base URL, timeout, request ID, and user-facing error mapping.
- Add typed API modules for specs, environments, execution, test generation, and payload building.
- Add Zustand stores for current spec, environment, execution, generated code, and UI state.
- Add loading, empty, error, retry, and success notification states.

**Validation**

- API modules compile against the existing route payloads.
- Store tests cover success, loading, and error transitions.
- Backend tests/build remain unchanged and green.

### Phase 3: Specification and Environment Workflows

**Work**

- Build spec import flow for document/file-compatible input and URL source, matching the existing import API.
- Build spec detail view with metadata, operations, tags, raw normalized data, and operation filtering.
- Build environment list scoped to the current spec.
- Build create/edit environment form with URL validation, auth configuration, headers, timeout, and delete confirmation using existing endpoints.
- Provide clear empty states where the backend does not provide a collection route.

**Validation**

- Import a spec, inspect operations and tags, create/update/delete an environment.
- Verify invalid input is handled without sending malformed requests.
- Verify no backend files change.

### Phase 4: Execution Workflow

**Work**

- Build a five-step run-plan flow: spec, environment, operations, options, review.
- Connect plan creation to execution.
- Poll `/execution/status/:runId` until completion with cleanup on unmount.
- Build live progress, logs, result filtering, request/result detail surfaces, retry-failed action, and aggregate views using the existing report shape.
- Keep risky actions explicit and preserve server-reported statuses.

**Validation**

- Create a plan and execute it against a configured environment.
- Confirm polling stops on completion or error.
- Confirm retry uses the existing retry endpoint and does not duplicate client state.

### Phase 5: Dashboard, Reports, and Test Generation

**Work**

- Build KPI and report surfaces from available current-run data.
- Add responsive charts only where data is available from existing responses.
- Add report export to JSON/CSV in the browser.
- Build Axios test generation form and syntax-highlighted code viewer with copy/download.
- Build schema and LLM payload builder modal using the existing payload endpoint.

**Validation**

- Generate test code and payloads through the existing APIs.
- Verify export, copy, and download actions.
- Verify charts remain readable on mobile and dark themes.

### Phase 6: Accessibility, Mobile Polish, and Hardening

**Work**

- Add responsive card/table transformations, mobile bottom navigation, skeletons, error boundaries, and offline/network messaging.
- Add ARIA labels, live regions for execution progress, dialog focus management, contrast checks, and touch-sized controls.
- Add lazy-loaded routes and restrained page/list/progress animations.
- Remove unsupported promises from the UI and ensure every unavailable backend capability has a useful explanation.

**Validation**

- Run frontend unit tests, TypeScript build, and lint/format checks.
- Verify the backend build and Jest suite again.

### Phase 7: Final Playwright Verification

**Work**

- Start the existing backend and frontend development servers on non-conflicting ports.
- Run Playwright against desktop and mobile viewports.
- Capture screenshots and console/network diagnostics.
- Exercise the critical flow: import or load spec context, inspect operations, configure environment, create plan, execute, inspect report, retry if applicable, generate tests, and switch themes.

**Acceptance checks**

- No uncaught browser console errors.
- No unexpected failed API requests.
- Main routes render at desktop and mobile sizes.
- Theme selector supports `Light`, `Dark`, and `System`.
- Backend health, build, tests, and route behavior remain intact.

## Implementation Record

Each phase will be recorded here after completion using this format:

### Phase N: [Name]

- **Status:** Not started / In progress / Complete
- **Files added or changed:**
- **Behavior delivered:**
- **Validation performed:**
- **Result:**
- **Notes or follow-up:**

### Phase 0: Baseline and Guardrails

- **Status:** Complete
- **Files added or changed:** `web-app/` scaffold and frontend-only configuration.
- **Behavior delivered:** Isolated Vite frontend directory with a development proxy targeting the existing backend.
- **Validation performed:** Existing backend source was left unchanged; frontend dependency installation completed.
- **Result:** Passed.
- **Notes or follow-up:** Backend route gaps remain documented and were not filled from the frontend.

### Phase 1: App Shell and Design System

- **Status:** Complete
- **Files added or changed:** `web-app/src/main.tsx`, `web-app/src/App.tsx`, `web-app/src/style.css`, `web-app/index.html`, `web-app/vite.config.ts`, `web-app/tsconfig.json`.
- **Behavior delivered:** Responsive navigation shell, dashboard, specification, environment, execution, reports, test studio, and settings surfaces; accessible focus styles; responsive mobile layout; Light/Dark/System theme persistence.
- **Validation performed:** `npm run build` in `web-app`.
- **Result:** Passed.
- **Notes or follow-up:** Workflow surfaces are being connected to live API actions in later phases.

### Phase 2: Typed API Client and State

- **Status:** Complete
- **Files added or changed:** `web-app/src/lib/api.ts`, `web-app/src/stores.ts`, `web-app/src/App.tsx`.
- **Behavior delivered:** Typed Axios methods for existing backend routes, Zustand state for health/spec/environment/run data, and live API connection status in the shell.
- **Validation performed:** `npm run build` in `web-app`.
- **Result:** Passed.
- **Notes or follow-up:** Full workflow forms will use these methods as they are completed.

### Phase 3: Specification and Environment Workflows

- **Status:** Initial UI complete; API actions staged
- **Files added or changed:** `web-app/src/App.tsx`, `web-app/src/lib/api.ts`, `web-app/src/stores.ts`.
- **Behavior delivered:** Specification and environment navigation surfaces, typed import/environment API methods, and responsive empty/data presentation.
- **Validation performed:** Frontend build and Playwright route navigation at mobile width.
- **Result:** Passed for the current UI slice.
- **Notes or follow-up:** Import and environment forms remain the next functional expansion; backend collection routes are intentionally still untouched.

### Phase 4: Execution Workflow

- **Status:** Initial UI complete; API actions staged
- **Files added or changed:** `web-app/src/App.tsx`, `web-app/src/lib/api.ts`, `web-app/src/stores.ts`.
- **Behavior delivered:** Five-step execution-plan presentation, preview panel, and typed plan/run/status/retry methods.
- **Validation performed:** Frontend build.
- **Result:** Passed for the current UI slice.
- **Notes or follow-up:** The wizard controls are ready for live form submission and polling implementation.

### Phase 5: Dashboard, Reports, and Test Generation

- **Status:** Report visualization pass complete; remaining export actions staged
- **Files added or changed:** `web-app/src/WorkflowScreens.tsx`, `web-app/src/style.css`.
- **Behavior delivered:** Current-run pass-rate, failure-count, and average-latency metrics; responsive Recharts views by method and tag; path-level aggregate details; readable dark-theme report surfaces.
- **Validation performed:** Frontend production build passed. Browser preview validation was unavailable because the local Vite preview returned 404 in the current environment.
- **Result:** Passed for the delivered report and theme slice.
- **Notes or follow-up:** Browser JSON/CSV export remains a later functional expansion.

### Phase 6: Accessibility, Mobile Polish, and Hardening

- **Status:** Initial pass complete
- **Files added or changed:** `web-app/src/App.tsx`, `web-app/src/style.css`.
- **Behavior delivered:** Skip link, focus-visible styling, mobile drawer navigation, responsive cards/layouts, touch-sized controls, mobile report rows/charts, loading-independent empty states, and readable Light/Dark/System theme persistence.
- **Validation performed:** Playwright mobile viewport at 390x844 and desktop build output.
- **Result:** Passed for the current UI slice.
- **Notes or follow-up:** Automated accessibility assertions can be expanded with the final form workflows.

### Phase 7: Final Playwright Verification

- **Status:** Complete for current implementation slice
- **Files added or changed:** `FE Plan.md`, plus the frontend files listed above.
- **Behavior delivered:** Frontend and backend ran together; desktop and mobile screenshots captured as `phase-7-desktop.png` and `phase-7-mobile.png`; mobile navigation opened and `/specs` navigation completed; Light/Dark/System controls are present.
- **Validation performed:** Backend `npm run build`; backend `npm test` with 7 suites and 17 tests passing; frontend `npm run build`; Playwright network check with `/api/health` returning `200 OK`.
- **Result:** Passed. The cumulative browser console contains stale errors from the earlier incorrect Vite invocation and pre-fix mount point; after the mount and proxy fixes, current navigation and health requests are successful.
- **Notes or follow-up:** Keep both dev servers running for local review; stop them when review is complete.

The final record will include the Playwright browser, viewport sizes, routes exercised, screenshots captured, console findings, network findings, and pass/fail result.

## Approval Request

Please approve this plan before frontend implementation begins. Approval also confirms the constraint that backend files and logic must remain untouched, and that the documented missing collection routes will not be added as part of this frontend implementation.