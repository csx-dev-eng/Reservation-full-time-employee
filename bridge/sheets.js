/**
 * Google Sheets CRM helper — append booking rows.
 */

const { google } = require('googleapis');

async function appendBooking(auth, spreadsheetId, tabName, row) {
  const sheets = google.sheets({ version: 'v4', auth });

  const values = [[
    row.booking_id,
    row.created_at,
    row.status,
    row.phone,
    row.plate_raw,
    row.plate_normalized,
    row.vehicle_type,
    row.date,
    row.start_time,
    row.end_time,
    row.calendar_event_id,
    row.price,
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tabName}!A:L`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  });
}

async function ensureHeaders(auth, spreadsheetId, tabName) {
  const sheets = google.sheets({ version: 'v4', auth });
  const headers = [
    'booking_id', 'created_at', 'status', 'phone',
    'plate_raw', 'plate_normalized', 'vehicle_type',
    'date', 'start_time', 'end_time', 'calendar_event_id', 'price',
  ];

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!A1:L1`,
  });

  if (!res.data.values || res.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabName}!A1:L1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });
    console.log('Sheet headers created.');
  }
}

module.exports = { appendBooking, ensureHeaders };
