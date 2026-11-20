# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Field operators, clients, and scheduling coordinators managing international service appointments across varying global timezones.

## Product Purpose

A mobile appointment utility that presents scheduled international bookings in their localized destination timezones, manages real-time check-in eligibility based on precise time window logic, and provides reliable offline-first local note persistence for operational handover.

## Positioning

Deterministic, transparent international schedule management: appointment times are decoupled from device local time and converted precisely to each booking's designated IANA timezone, accompanied by verified check-in compliance and fast offline note authoring.

## Operating Context

- Mobile handheld usage on Android and iOS (built with Expo SDK 58 and Expo Router).
- High-paced operational environments where quick search, fast check-in verification, and brief field notes (< 140 chars) are performed on the go.
- Variable network conditions: supports pull-to-refresh, local note caching in AsyncStorage, and clear empty/error resilience.

## Capabilities and Constraints

- **Preserved Business Rules:**
  - `canCheckIn(now, startsAt)`: strictly $\le 15$ minutes before start time or post-start.
  - Search filter: 300ms debouncing, minimum 3-character threshold, case-insensitive title matching.
  - Timezone conversion: formatted calendar date and 12-hour local time evaluated strictly in booking's IANA timezone via `Intl.DateTimeFormat`.
  - Notes: validated against empty string and > 140 characters, saved to `@booking_note_${bookingId}` via AsyncStorage.
  - Data resilient: skips malformed entries without discarding valid rows, handles `empty` and `error` states.
  - Keyboard handling: smooth avoidance and dismissibility.
- **Constraints:** Zero breaking changes to functional domain logic, route structure (`/` and `/bookings/[id]`), or automated test suites (24/24 vitest passing).

## Brand Commitments

- **Tone & Identity:** Utilitarian, reliable, crisp, calm, and trustworthy.
- **Visual Feel:** Premium mobile productivity craft—elevating bare wireframes into polished, tactile card layouts with purposeful typography and distinct status cues.

## Evidence on Hand

- 14 authentic baseline Android emulator screenshots documented in `docs/screenshots/baseline/`.
- 24 passing automated tests in `src/`.
- Comprehensive screen inventory and user interaction verification matrix in `App-flow.md`.

## Product Principles

1. **Clarity First:** Schedule, timezone, and check-in status must be comprehended within 2 seconds of viewing.
2. **Deterministic Truth:** Never misrepresent an appointment's timezone or eligibility window.
3. **Tactile Reassurance:** Every user action (searching, checking in, saving a note, refreshing) must provide instant, unambiguous sensory or visual feedback.
4. **Architectural Purity:** Visual and interaction polish must layer gracefully over existing domain models without architectural churn.

## Accessibility & Inclusion

- Adherence to WCAG AA color contrast standards in both light and dark color schemes.
- Minimum 44x44dp interactive touch targets.
- Clear semantic accessibility labels and states (`accessibilityRole`, `accessibilityState`).
