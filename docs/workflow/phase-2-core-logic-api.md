# Phase 2: Core Domain Logic, Fake Server, API Client & Automated Tests

## Prompt 3 Entry

- **Prompt Number:** 3
- **Timestamp:** 2026-11-20T12:12:50+05:30 (IST)
- **Original User Prompt:**
> Procced to Phase 2.

- **Associated Development Phase:** Phase 2: Core Domain Logic, Fake Server, API Client & Automated Tests
- **Discussion & Implementation Plan:**
  - Implemented domain model and validation function `isValidBooking` in `src/types/booking.ts`.
  - Implemented check-in logic `canCheckIn(now: Date, startsAt: Date): boolean` in `src/lib/check-in.ts`, strictly satisfying the 15-minute window rule (`startsAt.getTime() - now.getTime() <= 15 * 60 * 1000`).
  - Implemented in-app fake server `createFakeFetch()` in `src/api/fake-server.ts`:
    - Handles `EXPO_PUBLIC_BOOKINGS=empty` -> HTTP 200 with `[]`.
    - Handles `EXPO_PUBLIC_BOOKINGS=error` -> HTTP 500 with `{ "error": "unavailable" }`.
    - Handles default / unset -> 4-row fixture (studio, site, broken, review).
    - Returns real `Response` objects.
  - Implemented `fetchBookings(fetchFn: typeof fetch = fetch): Promise<Booking[]>` in `src/api/bookings.ts`:
    - Uses `EXPO_PUBLIC_API_URL` when provided.
    - Falls back to in-app fake server when environment variable is unset and default `fetch` is passed.
    - Checks `response.ok` and throws on HTTP errors (including 500).
    - Parses JSON and filters rows individually using `isValidBooking`, omitting `broken` without discarding valid rows.
  - Created automated test suites:
    - `src/lib/check-in.test.ts`: verified boundaries at 14:44 (false), 14:45 (true), 15:00 (true), and 15:30 (true).
    - `src/api/bookings.test.ts`: verified 4-row fixture returns 3 valid bookings excluding `broken`, HTTP 500 rejects/throws, unset env var uses fake server, and `empty`/`error` environment variable modes work properly.
  - Configured `vitest.config.mts` with `@/` path alias and verified zero warnings.

- **Actions Performed:**
  - [x] Created `src/types/booking.ts` with `Booking` interface and `isValidBooking` guard.
  - [x] Created `src/lib/check-in.ts` with `canCheckIn`.
  - [x] Created `src/api/fake-server.ts` with default fixture and `createFakeFetch`.
  - [x] Created `src/api/bookings.ts` with `fetchBookings`.
  - [x] Created `src/lib/check-in.test.ts` (4 unit tests).
  - [x] Created `src/api/bookings.test.ts` (5 unit tests).
  - [x] Configured `vitest.config.mts`.
  - [x] Ran automated test suite `npm test` -> 9 passed (100% pass).
  - [x] Ran `npx tsc --noEmit` -> 0 errors.
  - [x] Ran `npx expo lint` -> 0 errors.
  - [x] Committed Phase 2 changes to Git.

- **Actions Not Performed:**
  - [ ] None for Phase 2. Ready for Phase 3.

- **Decisions, Scope Boundaries & Missing Requirements:**
  - Used standard `Response` objects in fake server so client code uses standard fetch patterns.
  - Path alias `@/` mapped in `vitest.config.mts` for full consistency between Expo and test runners.

- **Files Modified / Created:**
  - `src/types/booking.ts` (Created)
  - `src/lib/check-in.ts` (Created)
  - `src/lib/check-in.test.ts` (Created)
  - `src/api/fake-server.ts` (Created)
  - `src/api/bookings.ts` (Created)
  - `src/api/bookings.test.ts` (Created)
  - `vitest.config.mts` (Created)
  - `docs/workflow/phase-2-core-logic-api.md` (Created)
  - `docs/AI-WORKFLOW.md` (Updated)

- **Tests Performed & Results:**
  - `npm test`: 2 test files passed, 9 tests passed.
  - `npx tsc --noEmit`: 0 errors.
  - `npx expo lint`: 0 errors.

- **Next Recommended Action:**
  - Request user approval to proceed to Phase 3: Booking List Screen (`/`) with Search & Refresh.
