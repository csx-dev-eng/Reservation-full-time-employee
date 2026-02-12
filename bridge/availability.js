/**
 * Availability helpers — compute working days and free-slot days.
 */

const { getFreeSlots } = require('./calendar');

function isWorkingDay(date) {
  const dow = date.getDay();
  return dow >= 1 && dow <= 5; // Mon=1 … Fri=5
}

function getWorkingDays(fromDate, count) {
  const days = [];
  const d = new Date(fromDate);
  d.setHours(0, 0, 0, 0);

  while (days.length < count) {
    if (isWorkingDay(d)) {
      days.push(formatDate(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function dayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sam'];
  const months = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

/**
 * GET /available-days?from=YYYY-MM-DD&count=30
 * Returns days that have at least 1 free slot.
 */
async function getAvailableDays(auth, calendarId, fromStr, count) {
  const workDays = getWorkingDays(new Date(fromStr), count);
  const results = [];

  // Check days in batches to avoid rate limits
  for (const day of workDays) {
    try {
      const free = await getFreeSlots(auth, calendarId, day);
      if (free.length > 0) {
        results.push({ date: day, label: dayLabel(day), freeCount: free.length });
      }
    } catch (err) {
      console.error(`Error checking ${day}:`, err.message);
    }
  }

  return results;
}

module.exports = { getAvailableDays, getWorkingDays, formatDate, dayLabel, isWorkingDay };
