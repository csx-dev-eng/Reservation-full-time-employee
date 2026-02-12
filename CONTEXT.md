# CONTEXT.md — Source of truth

## Business rules
- Slot length: 30 minutes
- Working hours: 08:00–16:00
- Break: 12:00–13:00 (no slots during break)
- Availability window: next 30 WORKING DAYS (Mon–Fri)
- Include “today” only if it is a working day AND has free slots left.

## WhatsApp UX rules
- User should interact via LIST menus and REPLY BUTTONS (no free-text commands required).
- Any first message (or unknown input in IDLE) returns MAIN MENU.
- LIST messages must contain max 10 rows total (use 9 items + optional “Mai mult” as the 10th).
- REPLY BUTTON messages max 3 buttons (Confirm / Modify / Menu).
- Always provide a way back to MAIN MENU.

## State machine (per phone)
- IDLE
- PICK_DAY
- PICK_SLOT
- PICK_VEHICLE
- WAIT_PLATE
- CONFIRM

Persist per phone:
- state
- pagination cursor for days and slots
- selectedDate
- selectedSlotStart/End
- vehicleType
- plate_raw, plate_normalized

Fallback:
- If input not understood, resend the correct menu for current state.

## Data outputs
### Google Calendar event
Must contain:
- Plate number (normalized or pretty)
- Phone number
- Vehicle category
Recommended:
- Summary: "ITP | {PLATE} | {PHONE} | {VEHICLE}"
- Description: recap + booking_id

### Google Sheets CRM
Spreadsheet tab: "Bookings"
Columns:
- booking_id
- created_at
- status
- phone
- plate_raw
- plate_normalized
- vehicle_type
- date
- start_time
- end_time
- calendar_event_id
- price

## Integration overview
- Node-RED:
  - GET /wa-webhook for Meta verification (hub.challenge)
  - POST /wa-webhook for incoming messages (respond 200 immediately)
  - sends messages via Meta Graph API using WA_TOKEN and WA_PHONE_NUMBER_ID

- Bridge service:
  - GET /available-days?from=YYYY-MM-DD&count=30
  - GET /availability?date=YYYY-MM-DD
  - POST /book (recheck + create event + append sheet)

Auth:
- Google service account key creation may be blocked by org policies.
- Therefore bridge should support OAuth Desktop flow for local dev if service accounts are blocked.