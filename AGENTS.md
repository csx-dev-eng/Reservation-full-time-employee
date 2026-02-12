# AGENTS.md — Instructions for Claude Code (agent)

You are Claude Code acting as an autonomous coding agent inside this repository.

## Source of truth
Read and follow, in this order:
1) CONTEXT.md
2) menu-structure.md
3) README.md (for setup expectations)

If there is a conflict, CONTEXT.md wins.

## Project summary
We are building a deterministic WhatsApp booking bot for an ITP station.

Stack:
- Node-RED (local, browser UI) handles WhatsApp webhook, conversation state machine, menu routing.
- Node.js "bridge" service handles Google Calendar + Google Sheets (availability + booking + CRM logging).
- WhatsApp Cloud API (Meta Graph API) for inbound/outbound messages.
- ngrok is used for exposing Node-RED webhook during demo.

We do NOT use AI/NLP inside the bot. Everything is menu/button-driven + fixed steps.

## What you MUST NOT do
- Do not introduce LLM calls or "AI agents" for interpretation.
- Do not exceed WhatsApp interactive limits (list rows max 10, reply buttons max 3).
- Do not change established ID conventions in menu-structure.md.
- Do not rewrite the entire app if only one part is broken. Make minimal changes.

## Primary goal
Make the Node-RED flow(s) and bridge work end-to-end with correct menu structure:
- Main menu list
- Day list pagination (9 + “Mai mult”)
- Slot list pagination (9 + “Mai mult”)
- Vehicle list
- Plate input step
- Recap + confirm buttons (Confirm / Modify / Menu)
- Confirm triggers booking (recheck -> Calendar event -> Sheets row -> confirmation + location)

## Secondary goals
- Improve robustness: ignore status-only webhook events, handle unknown input by resending correct menu for current state.
- Keep state per phone number with a simple, persistent store (Node-RED context file or existing storage in repo).

## Tasks you may perform
- Edit flows/flows.json (or whatever Node-RED export file exists)
- Edit bridge service code and its README
- Edit README.md, CONTEXT.md, menu-structure.md only if needed for clarity (prefer minimal changes)
- Add helper scripts or small utilities only if necessary

## Acceptance criteria (smoke test)
1) Meta webhook verification succeeds (GET /wa-webhook).
2) Sending “hi” to WhatsApp number returns the MAIN MENU list.
3) Click BOOK_START returns day list (9 days + optional “Mai mult”).
4) Click a day returns slot list (9 slots + optional “Mai mult”), respecting:
   - 30 min slot length
   - working hours 08:00–16:00
   - break 12:00–13:00
5) Click a slot -> vehicle category list.
6) Choose vehicle -> asks for plate. Any separators accepted; normalized internally.
7) After plate -> recap + confirm buttons (max 3).
8) Confirm -> recheck slot -> create Calendar event -> append Sheets CRM row -> send confirmation + location.
9) Unknown input -> resend correct menu for current state (or MAIN MENU if IDLE).