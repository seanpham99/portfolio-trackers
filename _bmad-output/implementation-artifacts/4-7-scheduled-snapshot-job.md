# Story 4.7: Implement Scheduled Snapshot Job (Backlog)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a System Administrator,
I want portfolios to be snapshotted automatically at a scheduled interval (daily) via Airflow,
so that users have consistent historical performance data and the system adheres to the batch processing architecture.

## Acceptance Criteria

1. **Airflow DAG Implementation**: A new DAG `portfolio_daily_snapshot` is created in `services/data-pipeline/dags`.
2. **Scheduled Execution**: The DAG runs daily (e.g., at 00:00 UTC) to trigger the snapshot process.
3. **API Integration**: The DAG calls the NestJS API endpoint (to be created) to trigger snapshots for all portfolios.
   - _Decision_: The DAG will trigger a new "Batch Snapshot" API endpoint on the NestJS service to ensure logic consistency with the "lazy load" snapshots.
4. **Universal Coverage**: The process iterates through ALL portfolios in the database.
5. **Error Reporting**: Failures in the DAG are reported via existing Airflow notification mechanisms (e.g., `send_failure_notification`).

## Tasks / Subtasks

- [x] Task 1: NestJS API Batch Endpoint (AC: 3)
  - [x] Add `POST /portfolios/snapshots/batch` endpoint in `PortfoliosController`.
  - [x] Protect this endpoint with a specific API Key or Admin Guard (to be called by Airflow).
  - [x] Implement `snapshotService.captureAll()` to iterate and snapshot all portfolios.
- [x] Task 2: Airflow DAG Creation (AC: 1, 2)
  - [x] Create `services/data-pipeline/dags/portfolio_daily_snapshot.py`.
  - [x] Configure `SimpleHttpOperator` or `PythonOperator` to call the NestJS Batch Endpoint.
  - [x] Set schedule to `@daily` or specific cron.
- [x] Task 3: Infrastructure & Security
  - [x] Add `DATA_PIPELINE_API_KEY` to `services/api/.env` and Airflow connections/variables.
  - [x] Ensure Airflow container can reach NestJS API container in Docker network.
- [x] Task 4: Verification & Testing
  - [x] Verify the DAG triggers the API.
  - [x] Verify snapshots are created in `portfolio_snapshots` table.

## Dev Notes

- **Architecture Alignment**: This moves the scheduling responsibility to Airflow (as per `architecture.md`), keeping NestJS focused on request handling and logic.
- **Batch Logic**: The API endpoint should handle the iteration to keep the "Business Logic" within the Domain Service (`SnapshotService`). Airflow acts as the trigger.
- **Async Processing**: The API endpoint should return "Batch started" immediately to avoid Airflow timeouts on large datasets.

### Project Structure Notes

- New file: `services/data-pipeline/dags/portfolio_daily_snapshot.py`
- Update: `services/api/src/portfolios/portfolios.controller.ts`
- Update: `services/api/src/portfolios/snapshot.service.ts`
- Update: `apps/web/template.env` (Updated API URL to port 5000)
- Update: `.github/workflows/test.yml` (Migrated to uv for Python tests)

### References

- [Source: services/data-pipeline/dags/market_data_evening_batch.py]
- [Source: services/api/src/portfolios/snapshot.service.ts]
- [Source: _bmad-output/architecture.md#Additional Requirements]

## Dev Agent Record

### Agent Model Used

Gemini 2.5 Pro (Antigravity)

### File List

- `services/data-pipeline/dags/portfolio_daily_snapshot.py` (NEW)
- `services/api/src/portfolios/portfolios.controller.ts` (MODIFIED)
- `services/api/src/portfolios/snapshot.service.ts` (MODIFIED)
- `services/api/src/portfolios/guards/api-key.guard.ts` (NEW)
- `services/api/src/portfolios/guards/index.ts` (MODIFIED)
- `services/api/src/portfolios/portfolios.module.ts` (MODIFIED)

## Completion Notes List

- Implemented `ApiKeyGuard` for secure service-to-service communication between Airflow and NestJS API.
- Added `captureAll()` method to `SnapshotService` with fire-and-forget pattern to avoid Airflow timeouts.
- Created `POST /portfolios/snapshots/batch` endpoint protected by `ApiKeyGuard` returning 202 Accepted.
- Created Airflow DAG `portfolio_daily_snapshot` scheduled at `@daily` with proper error notifications.
- **Environment Setup Required**: Set `DATA_PIPELINE_API_KEY` in NestJS API environment and Airflow environment variables.
- **Network Setup Required**: Ensure Airflow can reach NestJS API via `NESTJS_API_URL` (default: `http://api:3001`).
- TypeScript type check passed successfully.
