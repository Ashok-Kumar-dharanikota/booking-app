# Application Flow & Baseline Documentation

This document establishes the comprehensive functional and visual baseline of the **Booking App** mobile application, capturing all screens, navigation routes, user flows, and interactive state transitions as observed on the running Android emulator (`emulator-5554`, Android SDK 37) via **Argent**.

---

## 1. Application Overview

### Primary Purpose
The Booking App is a mobile utility designed to present scheduled appointments to users across international timezones, calculate real-time check-in availability according to strict business logic, and allow users to attach local persistent notes to each booking.

### Available Screens
The application follows a clean, single-stack navigation hierarchy powered by **Expo Router**:
1. **Booking List Screen (`/`)**: The home entry screen displaying all valid scheduled bookings, search controls, pull-to-refresh, and dynamic status indicators.
2. **Booking Detail Screen (`/bookings/[id]`)**: The detailed view for an individual booking, displaying title, identifier, timezone-converted calendar date and local time, check-in action, and a persistent local note card.

### Navigation Structure
```mermaid
flowchart TD
    A["Booking List Screen (/)"] -->|"Tap Booking Card"| B["Booking Detail Screen (/bookings/[id])"]
    B -->|"Tap Header Back / Navigate Up"| A
    A -->|"Pull-to-refresh Gesture"| A
    A -->|"Type Query in Search Bar"| A
    B -->|"Tap Check-in Button"| B
    B -->|"Tap Save Note Button"| B
```

### Main User Journey
1. The user opens the application and views the list of scheduled bookings.
2. The user can optionally filter bookings by entering a title keyword (e.g. `rev` to locate `Plan review`) or pull down to refresh the booking schedule.
3. The user taps a booking card to navigate into the **Booking Detail Screen**.
4. The user verifies the appointment calendar date and local time converted specifically to that booking's IANA timezone.
5. If the current time is 15 minutes or less before the start time (or post-start), the user taps **Check in**.
6. The user enters an operational note (under 140 characters) and taps **Save note**.
7. The user navigates back to the Booking List; if they re-open the booking later, their note is restored from local storage.

---

## 2. Screen Inventory

### Screen 1: Booking List Screen
- **Route:** `/`
- **Component File:** `src/app/index.tsx`
- **Purpose:** Serve as the home feed for scheduled bookings, providing search filtering, status handling, and pull-to-refresh synchronization.
- **Screenshot:**
  
  ![Booking List Screen](docs/screenshots/baseline/booking-list.png)

- **Visible UI Elements:**
  - Header Title: `"Bookings"`
  - Search Section Label: `"Search bookings"`
  - Search Input: Single-line `TextInput` with placeholder `"Search bookings"`
  - Refresh Status: `"Updated: <time>"` displaying the exact time of the last successful fetch
  - Virtualized Booking Cards:
    - Booking Title (e.g., `"Studio visit"`)
    - IANA Timezone Badge (e.g., `"America/New_York"`)
    - Action Hint: `"Tap to view details & check-in"`
- **Available Interactions:**
  - **Type in Search Input**: Filters titles case-insensitively with a 300ms debounce and a 3-character threshold.
  - **Pull Down (Swipe)**: Triggers pull-to-refresh via `RefreshControl`, updating bookings and the `Updated` timestamp.
  - **Tap Booking Card**: Navigates to `/bookings/[id]`.
  - **Tap Try Again Button** *(in error state)*: Re-triggers data fetching.
- **Navigation Destinations:**
  - `/bookings/[id]` on card press.
- **Screen States:**
  - **Loading**: Centered `ActivityIndicator` with `"Loading bookings..."`.
  - **Loaded Feed**: FlatList showing booking cards and `Updated` timestamp.
  - **Search Filtered**: Only matching booking cards displayed (e.g. `Plan review` for `rev`).
  - **No Match**: Centered `"No bookings match"` when search yields 0 items.
  - **Empty Dataset**: Centered `"No bookings"` when API returns an empty array.
  - **Error / Offline**: Centered `"Could not load bookings"` with a blue `"Try again"` button.

---

### Screen 2: Booking Detail Screen
- **Route:** `/bookings/[id]`
- **Component File:** `src/app/bookings/[id].tsx`
- **Purpose:** Present detailed schedule information in the booking's specific timezone, handle check-in eligibility, and provide local note authoring and persistence.
- **Screenshots:**

  | Studio Visit (New York) | Site Walkthrough (Los Angeles) | Plan Review (London) |
  |:---:|:---:|:---:|
  | ![Studio Visit](docs/screenshots/baseline/booking-detail-studio.png) | ![Site Walkthrough](docs/screenshots/baseline/booking-detail-site.png) | ![Plan Review](docs/screenshots/baseline/booking-detail-review.png) |

- **Visible UI Elements:**
  - Navigation Header: System back button (`"Navigate up"`) and screen title `"Booking Details"`.
  - Booking Title Heading (e.g. `"Studio visit"`, `"Site walkthrough"`, `"Plan review"`).
  - Booking ID Label (e.g. `"ID: studio"`).
  - Schedule & Timezone Information Card:
    - `"Calendar Date"`: Localized date formatted for the booking timezone (e.g., `"1 June 2026"`).
    - `"Local Time"`: Formatted 12-hour local time (e.g., `"11:00 AM"` or `"3:00 PM"`).
    - `"IANA Timezone"`: IANA identifier string (e.g., `"America/New_York"`, `"America/Los_Angeles"`, `"Europe/London"`).
  - Check-in Card:
    - Section Heading: `"Check-in"`
    - Action Button: `"Check in"` (or `"Checked in"`)
    - Guidance Text: Explains check-in window if disabled, or shows confirmation if checked in.
  - Note Card:
    - Section Heading: `"Note"`
    - Character Counter: `"0/140"` (turns red if > 140 characters).
    - Multiline Text Input: Placeholder `"Add your note here..."`.
    - Inline Feedback Text: Displays validation error or save confirmation.
    - Action Button: `"Save note"`.
- **Available Interactions:**
  - **Tap Header Back (`Navigate up`)**: Pops the route back to `/`.
  - **Tap Check in**: Marks the booking as checked in when `canCheckIn` is true.
  - **Type in Note Field**: Updates text and character counter in real-time.
  - **Tap Save note**: Validates note length (rejects empty or >140), writes to AsyncStorage, and displays `"Note saved"`.
- **Navigation Destinations:**
  - `/` (returns back on header back press).
- **Screen States:**
  - **Loading**: Centered spinner while reading API and AsyncStorage.
  - **Check-in Available**: Active blue button `"Check in"`.
  - **Check-in Unavailable**: Muted gray button with helper note `"Check-in opens 15 minutes before the start time."`.
  - **Checked In**: Green button `"Checked in"` with confirmation message `"You have successfully checked in for this booking."`.
  - **Note Empty Error**: Red message `"Enter a note"`.
  - **Note Length Error**: Red message `"Keep the note under 140 characters"`.
  - **Note Saved**: Green message `"Note saved"`.
  - **Note Restored**: Text input pre-populated with previously saved note.

---

## 3. User Flows & Observed Behaviors

### Flow 1: Search, Debouncing, and Threshold Filtering
1. **Threshold Enforcement**:
   - The user types 1 or 2 characters (e.g. `"r"` or `"re"`).
   - Observed behavior: Filtering is not triggered; all 3 bookings remain visible on screen.
2. **Debounced Query Execution**:
   - The user enters 3 characters: `"rev"`.
   - Observed behavior: After a 300ms pause, the list filters smoothly, displaying only `"Plan review"` (`Europe/London`).
3. **No-Match Query**:
   - The user types `"revxyz"`.
   - Observed behavior: The virtualized list clears and renders the label `"No bookings match"`.
4. **Clearing Search**:
   - Backspacing clears the search input.
   - Observed behavior: All default bookings return immediately to the view.

| Filtered Search (`rev`) | No Match (`revxyz`) |
|:---:|:---:|
| ![Filtered Search](docs/screenshots/baseline/booking-search-results.png) | ![No Match](docs/screenshots/baseline/booking-search-no-match.png) |

---

### Flow 2: Pull-to-Refresh & Timestamp Synchronization
1. The user initiates a downward drag on the Booking List scroll view.
2. The native `RefreshControl` spinner appears.
3. Fresh data is retrieved from `fetchBookings()`.
4. Upon resolution, the spinner disappears and the `"Updated: <time>"` label updates immediately (observed changing from `12:59:51 PM` to `1:24:28 PM`).

![Pull-to-Refresh Baseline](docs/screenshots/baseline/booking-list-refresh.png)

---

### Flow 3: Accurate Timezone Conversion Across Geographies
The application correctly decouples device local time from the booking's designated timezone using native `Intl.DateTimeFormat`:
- **Studio visit** (`2026-06-01T15:00:00.000Z`, `America/New_York`):
  - 15:00 UTC - 4 hrs EDT = **`11:00 AM`** on **`1 June 2026`**
- **Site walkthrough** (`2026-06-01T18:00:00.000Z`, `America/Los_Angeles`):
  - 18:00 UTC - 7 hrs PDT = **`11:00 AM`** on **`1 June 2026`**
- **Plan review** (`2026-06-01T14:00:00.000Z`, `Europe/London`):
  - 14:00 UTC + 1 hr BST = **`3:00 PM`** on **`1 June 2026`**

All three conversions have been verified live on the Android emulator and in automated unit tests.

---

### Flow 4: Check-in Eligibility & Interaction
1. `canCheckIn(now, startsAt)` evaluates whether current time is $\le 15$ minutes before start time or after start time.
2. Because fixture appointments are set to 1 June 2026 and current device date is in November 2026 (post-start), check-in is enabled.
3. When `"Check in"` is tapped, the button transitions to green with label `"Checked in"` and displays `"You have successfully checked in for this booking."`.

| Available | Confirmed |
|:---:|:---:|
| ![Check-in Available](docs/screenshots/baseline/check-in-available.png) | ![Check-in Confirmed](docs/screenshots/baseline/check-in-confirmed.png) |

---

### Flow 5: Note Authoring, Validation, and Persistence
1. **Empty Note Validation**:
   - Tapping `"Save note"` with an empty input produces the inline error: `"Enter a note"`.
2. **Authoring & Character Counting**:
   - Entering text dynamically increments the character counter (e.g. `"36/140"`, `"41/140"`).
3. **Saving Valid Note**:
   - Tapping `"Save note"` triggers persistence to `@booking_note_${bookingId}` and displays `"Note saved"`.
4. **Restoration Across Navigation**:
   - Tapping `"Navigate up"` returns the user to the list screen.
   - Re-tapping the same booking re-opens the detail screen and automatically restores the saved note from AsyncStorage into the text field.

| Empty Validation | Note Saved | Note Restored on Re-entry |
|:---:|:---:|:---:|
| ![Empty Validation](docs/screenshots/baseline/note-empty-validation.png) | ![Note Saved](docs/screenshots/baseline/note-saved.png) | ![Note Restored](docs/screenshots/baseline/note-restored.png) |

### Flow 6: Environment Configurations & Edge States (Empty & Error)
1. **Empty API Dataset (`EXPO_PUBLIC_BOOKINGS=empty`)**:
   - The fake server responds with `[]` (HTTP 200).
   - The list transitions to the centered empty placeholder: `"No bookings"`.
2. **API Failure & Retry (`EXPO_PUBLIC_BOOKINGS=error`)**:
   - The fake server responds with HTTP 500 (`{ "error": "unavailable" }`).
   - The list screen renders the error label `"Could not load bookings"` in red with a blue `"Try again"` button.

| Empty Dataset (`EXPO_PUBLIC_BOOKINGS=empty`) | API Error & Retry (`EXPO_PUBLIC_BOOKINGS=error`) |
|:---:|:---:|
| ![Empty Dataset](docs/screenshots/baseline/booking-list-empty.png) | ![API Error](docs/screenshots/baseline/booking-list-error.png) |

---

## 4. Interaction Verification Matrix

| ID | Screen / Flow | Interaction | Expected Behavior | Observed Behavior | Status | Evidence Type | Baseline Screenshot |
|:---|:---|:---|:---|:---|:---:|:---|:---|
| **V-01** | Booking List | Initial mount | Display 3 valid bookings, search bar, `Updated` label | Displayed Studio visit, Site walkthrough, Plan review with badge and timestamp | **PASS** | Argent live interaction | [booking-list.png](docs/screenshots/baseline/booking-list.png) |
| **V-02** | Booking List | Pull-to-refresh swipe down | Spinner shows, data refetches, `Updated:` time updates | Swiped down; timestamp updated from 12:59:51 PM to 1:24:28 PM | **PASS** | Argent live interaction | [booking-list-refresh.png](docs/screenshots/baseline/booking-list-refresh.png) |
| **V-03** | Search | Type `< 3` characters (`re`) | Do not initiate filter; show all bookings | All 3 bookings remain visible on screen | **PASS** | Automated test + Argent live | Code verified & tested |
| **V-04** | Search | Type `rev` (case-insensitive) | 300ms debounce, only `Plan review` shown | Filtered list displaying solely `Plan review` | **PASS** | Argent live interaction | [booking-search-results.png](docs/screenshots/baseline/booking-search-results.png) |
| **V-05** | Search | Type non-matching query (`revxyz`) | Display `No bookings match` empty state | Centered `No bookings match` displayed | **PASS** | Argent live interaction | [booking-search-no-match.png](docs/screenshots/baseline/booking-search-no-match.png) |
| **V-06** | Navigation | Tap booking card (`Studio visit`) | Navigate to `/bookings/studio` | Transitioned to detail screen with studio data | **PASS** | Argent live interaction | [booking-detail-studio.png](docs/screenshots/baseline/booking-detail-studio.png) |
| **V-07** | Timezone Conversion | Inspect Studio visit | Date: `1 June 2026`, Time: `11:00 AM`, TZ: `America/New_York` | Displays 1 June 2026, 11:00 AM, America/New_York | **PASS** | Argent live interaction | [booking-detail-studio.png](docs/screenshots/baseline/booking-detail-studio.png) |
| **V-08** | Timezone Conversion | Inspect Site walkthrough | Date: `1 June 2026`, Time: `11:00 AM`, TZ: `America/Los_Angeles` | Displays 1 June 2026, 11:00 AM, America/Los_Angeles | **PASS** | Argent live interaction | [booking-detail-site.png](docs/screenshots/baseline/booking-detail-site.png) |
| **V-09** | Timezone Conversion | Inspect Plan review | Date: `1 June 2026`, Time: `3:00 PM`, TZ: `Europe/London` | Displays 1 June 2026, 3:00 PM, Europe/London | **PASS** | Argent live interaction | [booking-detail-review.png](docs/screenshots/baseline/booking-detail-review.png) |
| **V-10** | Check-in | Evaluate `canCheckIn` > 15m prior | Button disabled with helper note | Returns `false` at 14:44 for 15:00 booking | **PASS** | Automated test (`check-in.test.ts`) | Code verified & tested |
| **V-11** | Check-in | Evaluate `canCheckIn` $\le 15$m / post-start | Button enabled (`Check in`) | Button active blue; tapped and updated to `Checked in` | **PASS** | Argent live interaction | [check-in-confirmed.png](docs/screenshots/baseline/check-in-confirmed.png) |
| **V-12** | Note Validation | Tap `Save note` when empty | Display `Enter a note` error | Inline error `Enter a note` rendered in red | **PASS** | Argent live interaction | [note-empty-validation.png](docs/screenshots/baseline/note-empty-validation.png) |
| **V-13** | Note Validation | Type > 140 chars and save | Display `Keep the note under 140 characters` | Character count shows red; validation rejects | **PASS** | Automated test (`notes.test.ts`) | Code verified & tested |
| **V-14** | Note Saving | Type valid note and save | Write to AsyncStorage; show `Note saved` | Shows `Note saved` in green; AsyncStorage written | **PASS** | Argent live interaction | [note-saved.png](docs/screenshots/baseline/note-saved.png) |
| **V-15** | Note Persistence | Navigate back to list and re-enter | Restore saved note in input field | Re-opened Studio visit; note restored from storage | **PASS** | Argent live interaction | [note-restored.png](docs/screenshots/baseline/note-restored.png) |
| **V-16** | Keyboard Handling | Focus note input, tap outside or tap Save note | Input dismisses cleanly, view avoids overlap | `Keyboard.dismiss()` on save & tap outside; `keyboardDismissMode="on-drag"` | **PASS** | Argent live interaction | [note-saved.png](docs/screenshots/baseline/note-saved.png) |
| **V-17** | Empty API Dataset | `EXPO_PUBLIC_BOOKINGS=empty` | Display `No bookings` | Returns `[]`, list shows centered `No bookings` | **PASS** | Automated test + Argent live capture | [booking-list-empty.png](docs/screenshots/baseline/booking-list-empty.png) |
| **V-18** | API Error & Retry | `EXPO_PUBLIC_BOOKINGS=error` | Display `Could not load bookings` + `Try again` | Throws HTTP 500; UI shows error with retry button | **PASS** | Automated test + Argent live capture | [booking-list-error.png](docs/screenshots/baseline/booking-list-error.png) |
| **V-19** | Malformed Row Skipping | 4-row fixture with `broken` | Returns 3 bookings, skips `broken` row | Parsed 3 valid rows; excluded malformed item | **PASS** | Automated test (`bookings.test.ts`) | Code verified & tested |

---

## 5. Phase 7B Impeccable UI Overhaul & Polished Verification

Following the baseline documentation, the application underwent a comprehensive UI/UX overhaul governed by **Impeccable** craft principles and a user-selected **Minimalist Monochromatic** visual direction (`#111827`, `#F9FAFB`, `#10B981`, `#059669`).

### Key Enhancements Implemented
1. **Lucide Vector Icons (`lucide-react-native` + `react-native-svg`)**:
   - Replaced all raw unicode characters and emojis with sharp, scalable Lucide vector icons (`Search`, `X`, `Clock`, `Calendar`, `MapPin`, `CheckCircle2`, `ChevronRight`, `Camera`, `Building2`, `ClipboardCheck`, `Palette`, `ShieldCheck`, `Music2`, `Users`, `AlertCircle`, `RefreshCw`, `UserCheck`, `Sparkles`).
2. **Relevant Banner Images (`expo-image`)**:
   - Integrated curated, high-resolution Unsplash architectural and studio photography for every booking card.
   - Rendered using `expo-image` with content-fit `cover`, smooth memory caching, and a floating category badge pill.
3. **Expanded Realistic Appointment Fixtures (7 Bookings)**:
   - Added 4 realistic appointments in `src/api/fake-server.ts`:
     - `consult`: Design consultation (`America/Chicago`, 44th Fl Chicago IL)
     - `audit`: Field security audit (`America/Denver`, 17th St Denver CO)
     - `rehearsal`: Sound stage rehearsal (`Asia/Tokyo`, Shibuya Tokyo JP)
     - `strategy`: Executive strategy sync (`Europe/Paris`, Place Vendôme Paris FR)
   - Retained the malformed `broken` row to rigorously verify resilient row skipping.
4. **Persistent Check-In via AsyncStorage**:
   - Implemented `saveBookingCheckIn` and `getAllCheckedInBookings` in `src/lib/check-in.ts`.
   - When a booking is checked in, the confirmation and timestamp are persisted locally under `@booking_checkin_${id}`.
   - On the Booking List screen, all cards query AsyncStorage on mount and screen focus, prominently displaying a green `✓ Checked in` badge directly on checked-in booking cards.
5. **Realistic Product Details & Metadata (`src/constants/booking-meta.ts`)**:
   - Added venue addresses, assigned host names, and preparation instructions for all bookings.
   - Rendered a dedicated `Location & Host` card on the detail screen with `MapPin`, `UserCheck`, and `Sparkles` icons.
6. **Unambiguous Note Feedback Message**:
   - Updated the save feedback to explicitly display `"Note saved successfully"` with an emerald Lucide `<CheckCircle2 />` icon, completely resolving visual ambiguity where "Note saved" was misread as "Not saved".
7. **Hardware-Synchronized Keyboard Handling**:
   - Upgraded to `react-native-keyboard-controller` with root `<KeyboardProvider>` in `src/app/_layout.tsx`.
   - Integrated `KeyboardAvoidingView` with platform-adaptive behavior in `src/app/bookings/[id].tsx`.
   - Keyboard smoothly avoids inputs without clipping, and auto-dismisses on note save or background tap.

### Polished Screen Gallery

| Booking List (7 Appointments & Checked-in Badge) | Search Filtered (`consult`) | Booking Details (Hero & Location/Host) |
|:---:|:---:|:---:|
| ![Booking List](docs/screenshots/polished/booking-list.png) | ![Search Filtered](docs/screenshots/polished/booking-search-results.png) | ![Booking Detail](docs/screenshots/polished/booking-detail.png) |
| *High-res banners, Lucide icons, and live Checked-in badge.* | *Instant debounce filtering for Chicago consultation.* | *Hero card, venue address, host name, & schedule table.* |

| Check-in Confirmed (Persisted) | Empty Note Validation | Note Saved Feedback (`Note saved successfully`) |
|:---:|:---:|:---:|
| ![Check-in Confirmed](docs/screenshots/polished/check-in-confirmed.png) | ![Empty Note Validation](docs/screenshots/polished/note-empty-validation.png) | ![Note Saved](docs/screenshots/polished/note-saved.png) |
| *Verified emerald confirmation card with timestamp.* | *Rose alert banner preventing empty notes.* | *Clear "Note saved successfully" with Lucide CheckCircle2.* |

| Booking List (Dark Mode) | Booking Details (Dark Mode) | Keyboard Controller Active |
|:---:|:---:|:---:|
| ![List Dark](docs/screenshots/polished/booking-list-dark.png) | ![Details Dark](docs/screenshots/polished/booking-detail-dark.png) | ![Keyboard Active](docs/screenshots/polished/booking-detail-keyboard-active.png) |
| *Deep slate `#0F172A` theme contrast.* | *Polished dark mode detail view.* | *KeyboardAvoidingView from react-native-keyboard-controller.* |

---

## 6. Verification Summary

All 27 automated unit tests across 5 test suites (`vitest run`), strict TypeScript checking (`tsc --noEmit`), and Expo ESLint linting (`expo lint`) continue to pass at 100% with zero errors and zero warnings. All functional requirements from the assignment specification remain intact.
