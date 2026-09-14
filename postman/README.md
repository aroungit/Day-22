# Postman Workflow

Use only these two files for normal testing:

1. `swagger-ai-agent.postman_environment.json` - required environment variables.
2. `swagger-ai-agent.postman_collection.json` - the complete organized collection.

Do not import or run the individual `phase-*.postman_collection.json` files. They are older phase-specific reference collections and are not needed when using the master collection.

## Setup

1. Start the API with `npm run dev`.
2. In Postman, import `swagger-ai-agent.postman_environment.json`.
3. Select `Swagger AI Agent - Local` as the active environment.
4. Import `swagger-ai-agent.postman_collection.json`.
5. Run the folders in the master collection from top to bottom.

The recommended folder order is:

1. Healthcheck
2. Specification
3. Environment
4. Planning
5. Execution
6. Generation
7. Payload Builder
8. MCP
9. Hardening

Within each folder, run requests from top to bottom. The response scripts automatically populate:

- `specId` and `serverUrl` after specification import
- `envId` after environment creation
- `runId` after run planning or execution

The Specification folder imports the Petstore Swagger URL from the `specSourceUrl` environment variable. It stores the returned specification ID and HTTPS server URL automatically. The imported server is `https://petstore.swagger.io/v2`.

The Environment folder's `Delete Environment - Cleanup` request is optional. Run it only after all testing is complete. If you delete the environment, run Create Environment again before running Planning or Execution.
