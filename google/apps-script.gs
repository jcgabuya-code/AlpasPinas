/**
 * AlpasPinas — Training sign-up web app
 * ------------------------------------------------------------------
 * Backs the /training page. Reads + writes a single append-only tab
 * called "Web Signups" in the team spreadsheet so the website is the
 * same source of truth on every device.
 *
 * Tab columns (row 1 is the header, created automatically on first run):
 *   Timestamp | EventId | EventTitle | Name | Gender | Side/Role |
 *   Weight (kg) | Need PFD? | Need Paddle? | Joining | Status
 *
 * Deploy:  Extensions -> Apps Script -> paste this -> Deploy ->
 *          New deployment -> Web app -> Execute as: Me,
 *          Who has access: Anyone -> copy the /exec URL.
 * See SHEET-SETUP.md for the full walkthrough.
 */

var SHEET_NAME = 'Web Signups';
var HEADERS = [
  'Timestamp', 'EventId', 'EventTitle', 'Name', 'Gender', 'Side/Role',
  'Weight (kg)', 'Need PFD?', 'Need Paddle?', 'Joining', 'Status'
];

// attending key <-> human label shown in the sheet
var JOINING_TO_KEY = { 'Saturday Only': 'sat', 'Sunday Only': 'sun', 'Both Days': 'both' };
var KEY_TO_JOINING = { sat: 'Saturday Only', sun: 'Sunday Only', both: 'Both Days' };

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** GET -> { ok: true, bookings: Booking[] } of all active sign-ups. */
function doGet() {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getSheet_();
    var last = sheet.getLastRow();
    var bookings = [];
    if (last > 1) {
      var rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var status = String(r[10] || '').toLowerCase();
        if (status === 'cancelled') continue;
        bookings.push({
          createdAt: r[0] ? new Date(r[0]).toISOString() : '',
          eventId: String(r[1] || ''),
          eventTitle: String(r[2] || ''),
          name: String(r[3] || ''),
          gender: String(r[4] || ''),
          side: String(r[5] || ''),
          weight: Number(r[6]) || 0,
          needPFD: String(r[7] || 'No'),
          needPaddle: String(r[8] || 'No'),
          attending: JOINING_TO_KEY[String(r[9] || '')] || 'both',
          status: status === 'confirmed' ? 'confirmed' : 'waiting'
        });
      }
    }
    return json_({ ok: true, bookings: bookings });
  } finally {
    lock.releaseLock();
  }
}

/**
 * POST body (text/plain JSON):
 *   { action: 'add', booking: {...} }   -> appends a row
 *   { action: 'cancel', eventId, name } -> marks matching rows cancelled
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var body = JSON.parse(e.postData.contents);
    var sheet = getSheet_();

    if (body.action === 'add') {
      var b = body.booking || {};
      var now = new Date();
      sheet.appendRow([
        now,
        b.eventId || '',
        b.eventTitle || '',
        b.name || '',
        b.gender || '',
        b.side || '',
        b.weight || '',
        b.needPFD || 'No',
        b.needPaddle || 'No',
        KEY_TO_JOINING[b.attending] || 'Both Days',
        'waiting'
      ]);
      return json_({
        ok: true,
        booking: {
          eventId: b.eventId, eventTitle: b.eventTitle || '', attending: b.attending,
          name: b.name, gender: b.gender, side: b.side, weight: b.weight,
          needPFD: b.needPFD, needPaddle: b.needPaddle, createdAt: now.toISOString(),
          status: 'waiting'
        }
      });
    }

    if (body.action === 'cancel') {
      var eventId = String(body.eventId || '');
      var name = String(body.name || '').trim().toLowerCase();
      var last = sheet.getLastRow();
      var n = 0;
      if (last > 1) {
        var rng = sheet.getRange(2, 1, last - 1, HEADERS.length);
        var vals = rng.getValues();
        for (var i = 0; i < vals.length; i++) {
          if (String(vals[i][1]) === eventId &&
              String(vals[i][3]).trim().toLowerCase() === name &&
              String(vals[i][10]).toLowerCase() !== 'cancelled') {
            sheet.getRange(i + 2, 11).setValue('cancelled');
            n++;
          }
        }
      }
      return json_({ ok: true, cancelled: n });
    }

    if (body.action === 'approve') {
      var eventId = String(body.eventId || '');
      var name = String(body.name || '').trim().toLowerCase();
      var last = sheet.getLastRow();
      var n = 0;
      if (last > 1) {
        var rng = sheet.getRange(2, 1, last - 1, HEADERS.length);
        var vals = rng.getValues();
        for (var i = 0; i < vals.length; i++) {
          if (String(vals[i][1]) === eventId &&
              String(vals[i][3]).trim().toLowerCase() === name &&
              String(vals[i][10]).toLowerCase() === 'waiting') {
            sheet.getRange(i + 2, 11).setValue('confirmed');
            n++;
          }
        }
      }
      return json_({ ok: true, approved: n });
    }

    return json_({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
