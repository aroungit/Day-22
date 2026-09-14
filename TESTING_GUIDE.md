# Swagger AI Agent Testing Guide

This guide explains how to test the backend API, the Postman workflow, and the frontend locally.

## 1. Prerequisites

- Node.js 20 or newer
- npm
- Postman, if running the API workflow manually
- Internet access for the Petstore Swagger document and Petstore API calls

Install dependencies once from the repository root:

```powershell
Set-Location 'D:\GenAI_Tools\Day 22'
npm install
Set-Location web-app
npm install
Set-Location ..
```

## 2. Run Backend Automated Tests

Open a terminal at the repository root and run:

```powershell
Set-Location 'D:\GenAI_Tools\Day 22'
npm test
```

Expected result: Jest completes successfully with all suites passing.

Run the TypeScript check too:

```powershell
npm run build
```

The build uses `tsc --noEmit`, so it checks types without creating a `dist` directory.

## 3. Start the Backend API

In a terminal at the repository root:

```powershell
npm run dev
```

The API starts at `http://localhost:3000` by default. Keep this terminal running while testing.

### Quick health check

Open another terminal and run:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "swagger-ai-agent",
  "environment": "development"
}
```

## 4. Run the Complete Postman Workflow

The master collection is the recommended manual test. Do not import the older `phase-*.postman_collection.json` files for normal testing.

### Import the collection and environment

1. Open Postman.
2. Import `postman/swagger-ai-agent.postman_environment.json`.
3. Select `Swagger AI Agent - Local` as the active environment.
4. Import `postman/swagger-ai-agent.postman_collection.json`.
5. Open the environment and confirm `baseUrl` is `http://localhost:3000`.
6. Run the collection folders in this order:

   1. Healthcheck
   2. Specification
   3. Environment
   4. Planning
   5. Execution
   6. Generation
   7. Payload Builder
   8. MCP
   9. Hardening

Run each request in a folder from top to bottom. Postman test scripts automatically save these values for later requests:

- `specId` and `serverUrl` after specification import
- `envId` after environment creation
- `runId` after planning or execution

### What to verify in each folder

#### Healthcheck

- `GET /health` returns HTTP `200`.
- The response has `status: "ok"`.

#### Specification

- Importing `https://petstore.swagger.io/v2/swagger.json` returns HTTP `201`.
- The response contains a generated specification `id`.
- Metadata, operations, and tags can be retrieved with HTTP `200`.
- The operation list includes `findPetsByStatus`.
- Validation returns `{ "valid": true }` for a valid document.

#### Environment

- Creating an environment returns HTTP `201` and an `id`.
- The environment uses the imported Petstore server URL.
- List, get, and update requests return HTTP `200`.
- Delete is optional and should be run only after all other tests.

#### Planning

- Planning by operation returns HTTP `201` and a `runId`.
- Planning by tag works with the `pet` tag.
- Planning the full specification works with `all: true`.
- An unknown operation or tag returns a clear client error, normally HTTP `400`.

#### Execution

- Execute the saved plan using its `runId`.
- Confirm the response contains a run report and summary.
- Query execution status with the saved `runId`.
- Query the aggregate report with the same `runId`.
- Use retry-failed only after a run containing failed cases.

#### Generation

- Preview generated Axios tests for the imported specification.
- Generate tests for one operation or the full specification.
- Confirm the response contains generated JavaScript/TypeScript test code and metadata.

#### Payload Builder

- Test a request with an `example` or JSON `schema`.
- Confirm the service returns a payload and identifies its source.
- The default local LLM adapter is intentionally unconfigured. Requests that require an LLM may return a clear configuration error unless an LLM adapter is provided.

#### MCP

- Run each Swagger MCP request with the IDs created earlier.
- Confirm successful requests return HTTP `200`.
- Confirm missing or unknown IDs return a useful error instead of an unhandled server failure.

#### Hardening

- Send malformed JSON or invalid request values where the collection provides them.
- Confirm the API returns a controlled `4xx` response.
- Confirm unknown resources return `404`.
- Confirm repeated requests eventually respect the configured rate limit.

## 5. Test Important Negative Cases Manually

Use these checks when validating error handling:

```powershell
# Unknown specification
Invoke-WebRequest http://localhost:3000/spec/does-not-exist -UseBasicParsing

# Invalid specification
$body = '{"openapi":"3.0.3","info":{},"paths":{}}'
Invoke-WebRequest http://localhost:3000/spec/validate -Method Post -ContentType 'application/json' -Body $body -UseBasicParsing

# Missing planning selection
$body = '{"specId":"does-not-exist","envName":"local"}'
Invoke-WebRequest http://localhost:3000/execution/plan -Method Post -ContentType 'application/json' -Body $body -UseBasicParsing
```

Check that the response status is a controlled `4xx` and that the JSON body contains an `error` message or `valid: false`.

## 6. Test the Frontend

Start the backend first. Then open a second terminal:

```powershell
Set-Location 'D:\GenAI_Tools\Day 22\web-app'
npm run dev
```

Open `http://localhost:5173` in a browser.

Verify the following:

1. The application loads without uncaught browser-console errors.
2. The health/API-connected screens load while the backend is running.
3. Specification, environment, planning, execution, report, test-generation, and payload-builder actions show loading, success, and error states.
4. Light, Dark, and System themes work and persist after a refresh.
5. The layout works at desktop and mobile widths.
6. Keyboard focus is visible and the main controls can be reached without a mouse.

Run frontend automated checks from `web-app`:

```powershell
npm run build
```

The frontend currently has no Vitest test files, so `npm test` exits with `No test files found`. Treat adding frontend tests as a follow-up; use the browser checks above for current frontend behavior validation.

## 7. Reset Between Test Runs

The backend uses in-memory repositories. Restarting the backend clears all imported specifications, environments, plans, and reports.

To reset completely:

1. Stop the backend with `Ctrl+C`.
2. Start it again with `npm run dev`.
3. Rerun the Postman collection from Healthcheck through Specification.
4. Allow the Postman scripts to create fresh `specId`, `envId`, and `runId` values.

## 8. Suggested Test Pass Checklist

- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] `GET /health` returns `200`.
- [ ] Petstore specification imports successfully.
- [ ] Operations and tags are available.
- [ ] Environment CRUD works.
- [ ] Plans can be created by operation, tag, and full specification.
- [ ] A run report and aggregate report are returned.
- [ ] Failed-run retry is handled correctly.
- [ ] Axios test generation returns code.
- [ ] Invalid input returns controlled errors.
- [ ] Frontend `npm run build` passes.
- [ ] Frontend Vitest tests pass once test files are added.
- [ ] Frontend behavior works on desktop and mobile.