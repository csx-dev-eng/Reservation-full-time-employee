/**
 * Google Calendar helpers — list busy slots, create events.
 */

const { google } = require('googleapis');

const SLOT_MINUTES = 30;

// Working hours: 08:00–12:00, 13:00–16:00 (break 12:00–13:00)
const WORK_BLOCKS = [
  { startHour: 8, startMin: 0, endHour: 12, endMin: 0 },
  { startHour: 13, startMin: 0, endHour: 16, endMin: 0 },
];

function allSlotsForDay(dateStr) {
  const slots = [];
  for (const block of WORK_BLOCKS) {
    let h = block.startHour;
    let m = block.startMin;
    while (h < block.endHour || (h === block.endHour && m < block.endMin)) {
      const endM = m + SLOT_MINUTES;
      const eh = h + Math.floor(endM / 60);
      const em = endM % 60;
      if (eh > block.endHour || (eh === block.endHour && em > block.endMin)) break;
      slots.push({
        start: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        end: `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`,
      });
      h = eh;
      m = em;
    }
  }
  return slots;
}

async function getBusySlots(auth, calendarId, dateStr) {
  const calendar = google.calendar({ version: 'v3', auth });
  const timeMin = `${dateStr}T00:00:00Z`;
  const timeMax = `${dateStr}T23:59:59Z`;

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: 'Europe/Bucharest',
      items: [{ id: calendarId }],
    },
  });

  return (res.data.calendars[calendarId] || {}).busy || [];
}

function busyCovers(busyList, dateStr, slotStart, slotEnd) {
  const sdt = new Date(`${dateStr}T${slotStart}:00+02:00`).getTime();
  const edt = new Date(`${dateStr}T${slotEnd}:00+02:00`).getTime();

  for (const b of busyList) {
    const bs = new Date(b.start).getTime();
    const be = new Date(b.end).getTime();
    // Overlap check
    if (bs < edt && be > sdt) return true;
  }
  return false;
}

async function getFreeSlots(auth, calendarId, dateStr) {
  const all = allSlotsForDay(dateStr);
  const busy = await getBusySlots(auth, calendarId, dateStr);

  return all.filter((s) => !busyCovers(busy, dateStr, s.start, s.end));
}

async function createEvent(auth, calendarId, { dateStr, startTime, endTime, summary, description }) {
  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary,
    description,
    start: {
      dateTime: `${dateStr}T${startTime}:00`,
      timeZone: 'Europe/Bucharest',
    },
    end: {
      dateTime: `${dateStr}T${endTime}:00`,
      timeZone: 'Europe/Bucharest',
    },
  };

  const res = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });

  return res.data;
}

module.exports = { allSlotsForDay, getFreeSlots, createEvent };
