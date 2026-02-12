# menu-structure.md — WhatsApp menu structure (no AI)

## Strict ID conventions
Main menu:
- MENU_MAIN
- BOOK_START
- DOCS
- PRICE
- LOCATION

Day list:
- DAY_YYYY-MM-DD
- DAY_MORE_YYYY-MM-DD  (cursor = last date shown)

Slot list:
- SLOT_YYYY-MM-DD_HH:MM
- SLOT_MORE_YYYY-MM-DD_HH:MM (cursor = last slot start shown)

Vehicle:
- VEH_AUTO
- VEH_GPL
- VEH_UTIL

Confirm buttons:
- CONFIRM_BOOK
- EDIT_BOOK
- MENU_MAIN

## Step 1 — MAIN MENU (LIST)
When: any first user message (IDLE) or unknown input in IDLE.
Text (RO):
- Header: "ITP Programari"
- Body: "Alege o optiune:"
Options:
- BOOK_START: "Programare ITP"
- DOCS: "Documente necesare"
- PRICE: "Tarife"
- LOCATION: "Locatie"

## Step 2 — PICK_DAY (LIST, 9 + Mai mult)
When: after BOOK_START or after DAY_MORE...
Show next available WORKING DAYS (Mon–Fri) within next 30 working days, only days with >=1 free slot.
- Up to 9 DAY_YYYY-MM-DD rows
- If more results exist, add row #10:
  - DAY_MORE_<cursorDate> with title "Mai mult"

## Step 3 — PICK_SLOT (LIST, 9 + Mai mult)
When: after DAY_YYYY-MM-DD or after SLOT_MORE...
Schedule:
- 30 min slots
- 08:00–12:00 and 13:00–16:00 only
Show up to 9 free slots, then "Mai mult" as row #10 if more exist.

Rows:
- SLOT_YYYY-MM-DD_HH:MM title "HH:MM–HH:MM"
- SLOT_MORE_YYYY-MM-DD_HH:MM title "Mai mult"

## Step 4 — PICK_VEHICLE (LIST)
When: after SLOT_...
Options:
- VEH_AUTO "Auto"
- VEH_GPL "Auto + GPL"
- VEH_UTIL "Utilitara"

## Step 5 — WAIT_PLATE (TEXT)
When: after VEH_...
Bot asks (RO):
"Scrie numarul de inmatriculare (ex: AR24CSX)."

Normalization:
- uppercase
- keep only [A-Z0-9]
- accept any separators: space, dash, dot, slash

## Step 6 — CONFIRM (REPLY BUTTONS, max 3)
When: after plate is received and normalized.
Bot shows recap (RO) including:
- Zi, ora, categorie, numar, telefon, tarif, documente
Final line: "Confirmi programarea?"

Buttons (max 3):
- CONFIRM_BOOK ("Confirm")
- EDIT_BOOK ("Modifica")
- MENU_MAIN ("Meniu")

Booking rule:
- Only on CONFIRM_BOOK -> recheck slot -> book -> log -> confirm -> send location.

## Fallback rules
- Unknown input:
  - If IDLE -> send MAIN MENU
  - Else -> resend the expected menu for the current state