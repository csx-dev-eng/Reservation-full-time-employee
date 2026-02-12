# ITP Booking Bot — WhatsApp Reservation System

A deterministic WhatsApp booking bot for an ITP (vehicle inspection) station.
No AI/NLP — fully menu and button driven.

## Architecture

```
WhatsApp User
     │
     ▼
Meta Cloud API  ──webhook──►  Node-RED (port 1880)
     ▲                           │
     │                           │ HTTP calls
     └── sends messages ◄───────┘
                                 │
                                 ▼
                          Bridge Service (port 3001)
                           │           │
                           ▼           ▼
                    Google Calendar  Google Sheets
```

### Components

| Component | Path | Purpose |
|-----------|------|---------|
| **Node-RED** | `node-red/` | WhatsApp webhook, conversation state machine, menu routing |
| **Bridge** | `bridge/` | Google Calendar availability, booking, Sheets CRM logging |

## Conversation Flow

1. **Main Menu** — Book / Docs / Prices / Location
2. **Pick Day** — paginated list of working days with free slots (9 + "Mai mult")
3. **Pick Slot** — paginated 30-min slots, 08–12 and 13–16 (9 + "Mai mult")
4. **Pick Vehicle** — Auto / Auto+GPL / Utilitara
5. **Enter Plate** — free text, auto-normalized to uppercase alphanumeric
6. **Confirm** — recap with 3 buttons: Confirm / Modify / Menu
7. **Booking** — recheck slot → Calendar event → Sheets row → confirmation + location

## Setup

### Prerequisites

- Node.js 18+
- ngrok (for exposing webhook during development)
- A WhatsApp Business account with Cloud API access
- A Google Cloud project with Calendar and Sheets APIs enabled

### 1. Bridge Service

```bash
cd bridge
cp .env.example .env
# Fill in your Google credentials and calendar/sheet IDs in .env
npm install
npm start
```

**Google Auth**: The bridge supports two auth methods:
- **Service Account** (recommended): Place `service-account.json` in the `bridge/` folder
- **OAuth Desktop**: Set `GOOGLE_AUTH_METHOD=oauth` in `.env` and provide OAuth client credentials. On first run, follow the terminal prompts to authorize.

### 2. Node-RED

```bash
cd node-red
cp .env.example .env
# Fill in WA_TOKEN, WA_PHONE_NUMBER_ID, WA_VERIFY_TOKEN in .env
npm install
npm start
```

Node-RED will start on `http://localhost:1880`. The flows are auto-loaded from `flows.json`.

### 3. ngrok (Development)

```bash
ngrok http 1880
```

Copy the HTTPS URL and configure it as your WhatsApp webhook:
- **Callback URL**: `https://your-ngrok-url/wa-webhook`
- **Verify Token**: same value as `WA_VERIFY_TOKEN` in `node-red/.env`

### Quick Start (Both Services)

```bash
./scripts/start-all.sh
```

## Configuration

### Bridge `.env`

| Variable | Description |
|----------|-------------|
| `GOOGLE_CALENDAR_ID` | Google Calendar ID for booking events |
| `GOOGLE_SHEET_ID` | Google Sheets spreadsheet ID for CRM |
| `GOOGLE_AUTH_METHOD` | `service_account` or `oauth` |
| `PRICE_AUTO` | Price for Auto (default: 200 RON) |
| `PRICE_GPL` | Price for Auto+GPL (default: 250 RON) |
| `PRICE_UTIL` | Price for Utilitara (default: 300 RON) |

### Node-RED `.env`

| Variable | Description |
|----------|-------------|
| `WA_TOKEN` | WhatsApp Cloud API Bearer token |
| `WA_PHONE_NUMBER_ID` | WhatsApp Business phone number ID |
| `WA_VERIFY_TOKEN` | Custom verify token for webhook setup |
| `BRIDGE_URL` | Bridge service URL (default: `http://localhost:3001`) |
| `STATION_LAT` / `STATION_LON` | Station GPS coordinates for location messages |

## Bridge API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/available-days?from=YYYY-MM-DD&count=30` | GET | Working days with free slots |
| `/availability?date=YYYY-MM-DD` | GET | Free 30-min slots for a date |
| `/book` | POST | Recheck + create event + log to Sheets |
| `/health` | GET | Health check |
| `/prices` | GET | Current pricing |

## Business Rules

- **Slot length**: 30 minutes
- **Working hours**: 08:00–16:00
- **Break**: 12:00–13:00 (no slots)
- **Availability window**: next 30 working days (Mon–Fri)
- **WhatsApp limits**: max 10 list rows, max 3 reply buttons
