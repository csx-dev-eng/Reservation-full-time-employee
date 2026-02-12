/**
 * ITP Bridge Service
 *
 * Endpoints:
 *   GET  /available-days?from=YYYY-MM-DD&count=30
 *   GET  /availability?date=YYYY-MM-DD
 *   POST /book
 */

require('dotenv').config();

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getAuthClient } = require('./google-auth');
const { getFreeSlots, createEvent } = require('./calendar');
const { appendBooking, ensureHeaders } = require('./sheets');
const { getAvailableDays, formatDate } = require('./availability');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_TAB = process.env.GOOGLE_SHEET_TAB || 'Bookings';

const PRICES = {
  VEH_AUTO: Number(process.env.PRICE_AUTO) || 200,
  VEH_GPL: Number(process.env.PRICE_GPL) || 250,
  VEH_UTIL: Number(process.env.PRICE_UTIL) || 300,
};

const VEHICLE_LABELS = {
  VEH_AUTO: 'Auto',
  VEH_GPL: 'Auto + GPL',
  VEH_UTIL: 'Utilitara',
};

let authClient = null;

async function ensureAuth() {
  if (!authClient) {
    authClient = await getAuthClient();
  }
  return authClient;
}

// ── GET /available-days ──────────────────────────────────────────────
app.get('/available-days', async (req, res) => {
  try {
    const auth = await ensureAuth();
    const from = req.query.from || formatDate(new Date());
    const count = parseInt(req.query.count, 10) || 30;

    const days = await getAvailableDays(auth, CALENDAR_ID, from, count);
    res.json({ days });
  } catch (err) {
    console.error('GET /available-days error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /availability ────────────────────────────────────────────────
app.get('/availability', async (req, res) => {
  try {
    const auth = await ensureAuth();
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date query param required' });

    const slots = await getFreeSlots(auth, CALENDAR_ID, date);
    res.json({ date, slots });
  } catch (err) {
    console.error('GET /availability error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /book ───────────────────────────────────────────────────────
app.post('/book', async (req, res) => {
  try {
    const auth = await ensureAuth();
    const { date, startTime, endTime, vehicleType, plateRaw, plateNormalized, phone } = req.body;

    if (!date || !startTime || !endTime || !vehicleType || !plateNormalized || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1) Recheck slot availability
    const freeSlots = await getFreeSlots(auth, CALENDAR_ID, date);
    const slotFree = freeSlots.some((s) => s.start === startTime && s.end === endTime);
    if (!slotFree) {
      return res.status(409).json({ error: 'Slot no longer available', code: 'SLOT_TAKEN' });
    }

    // 2) Create calendar event
    const bookingId = uuidv4().slice(0, 8).toUpperCase();
    const price = PRICES[vehicleType] || 0;
    const vehicleLabel = VEHICLE_LABELS[vehicleType] || vehicleType;

    const summary = `ITP | ${plateNormalized} | ${phone} | ${vehicleLabel}`;
    const description = [
      `Booking ID: ${bookingId}`,
      `Numar: ${plateNormalized}`,
      `Telefon: ${phone}`,
      `Vehicul: ${vehicleLabel}`,
      `Tarif: ${price} RON`,
    ].join('\n');

    const calEvent = await createEvent(auth, CALENDAR_ID, {
      dateStr: date,
      startTime,
      endTime,
      summary,
      description,
    });

    // 3) Append CRM row
    await appendBooking(auth, SHEET_ID, SHEET_TAB, {
      booking_id: bookingId,
      created_at: new Date().toISOString(),
      status: 'confirmed',
      phone,
      plate_raw: plateRaw || plateNormalized,
      plate_normalized: plateNormalized,
      vehicle_type: vehicleLabel,
      date,
      start_time: startTime,
      end_time: endTime,
      calendar_event_id: calEvent.id,
      price,
    });

    res.json({
      success: true,
      bookingId,
      calendarEventId: calEvent.id,
      price,
      vehicleLabel,
    });
  } catch (err) {
    console.error('POST /book error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /health ──────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── GET /prices ──────────────────────────────────────────────────────
app.get('/prices', (_req, res) => {
  res.json({
    VEH_AUTO: { label: 'Auto', price: PRICES.VEH_AUTO },
    VEH_GPL: { label: 'Auto + GPL', price: PRICES.VEH_GPL },
    VEH_UTIL: { label: 'Utilitara', price: PRICES.VEH_UTIL },
  });
});

// ── Start ────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`Bridge service running on port ${PORT}`);
  try {
    const auth = await ensureAuth();
    await ensureHeaders(auth, SHEET_ID, SHEET_TAB);
    console.log('Google auth OK, sheet headers verified.');
  } catch (err) {
    console.warn('Initial auth/sheet check failed (will retry on requests):', err.message);
    authClient = null;
  }
});
