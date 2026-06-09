/**
 * AlpasPinas — Roster web app
 * ------------------------------------------------------------------
 * Backs the /roster page. Reads + writes a single tab called "Roster"
 * in the team spreadsheet so membership updates made in the sheet are
 * reflected on the site automatically.
 *
 * Tab columns (row 1 is the header, created automatically on first run):
 *   Name | Role | Side | Joined | Photo | Status
 *
 * Deploy:  Extensions -> Apps Script -> paste this -> Deploy ->
 *          New deployment -> Web app -> Execute as: Me,
 *          Who has access: Anyone -> copy the /exec URL.
 * See ROSTER-SETUP.md for the full walkthrough.
 */

var SHEET_NAME = 'Roster';
var HEADERS = ['Name', 'Role', 'Side', 'Joined', 'Photo', 'Status'];

function getRosterSheet_() {
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

/**
 * GET -> { ok: true, members: Member[] }
 * Add ?admin=1 to include inactive members and the status field.
 */
function doGet(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sheet = getRosterSheet_();
    var last = sheet.getLastRow();
    var includeAll = e && e.parameter && e.parameter.admin === '1';
    var members = [];
    if (last > 1) {
      var rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
      for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        var status = String(r[5] || 'active').toLowerCase();
        if (!includeAll && status === 'inactive') continue;
        var member = {
          name:   String(r[0] || ''),
          role:   String(r[1] || ''),
          side:   String(r[2] || '—'),
          joined: Number(r[3]) || 0,
          photo:  String(r[4] || '') || null
        };
        if (includeAll) member.status = status;
        members.push(member);
      }
    }
    return json_({ ok: true, members: members });
  } finally {
    lock.releaseLock();
  }
}

/**
 * POST body (text/plain JSON):
 *   { action: 'add',    member: { name, role, side, joined, photo? } }
 *   { action: 'remove', name: '...' }
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var body = JSON.parse(e.postData.contents);
    var sheet = getRosterSheet_();

    if (body.action === 'add') {
      var m = body.member || {};
      sheet.appendRow([
        m.name   || '',
        m.role   || '',
        m.side   || '—',
        m.joined || new Date().getFullYear(),
        m.photo  || '',
        'active'
      ]);
      return json_({
        ok: true,
        member: {
          name:   m.name   || '',
          role:   m.role   || '',
          side:   m.side   || '—',
          joined: m.joined || new Date().getFullYear(),
          photo:  m.photo  || null
        }
      });
    }

    if (body.action === 'remove') {
      var name = String(body.name || '').trim().toLowerCase();
      var last = sheet.getLastRow();
      var n = 0;
      if (last > 1) {
        var vals = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
        for (var i = 0; i < vals.length; i++) {
          if (String(vals[i][0]).trim().toLowerCase() === name &&
              String(vals[i][5]).toLowerCase() !== 'inactive') {
            sheet.getRange(i + 2, 6).setValue('inactive');
            n++;
          }
        }
      }
      return json_({ ok: true, removed: n });
    }

    if (body.action === 'edit') {
      var originalName = String(body.originalName || '').trim().toLowerCase();
      var m = body.member || {};
      var last = sheet.getLastRow();
      var n = 0;
      if (last > 1) {
        var vals = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
        for (var i = 0; i < vals.length; i++) {
          if (String(vals[i][0]).trim().toLowerCase() === originalName) {
            sheet.getRange(i + 2, 1, 1, HEADERS.length).setValues([[
              m.name   !== undefined ? m.name   : vals[i][0],
              m.role   !== undefined ? m.role   : vals[i][1],
              m.side   !== undefined ? m.side   : vals[i][2],
              m.joined !== undefined ? m.joined : vals[i][3],
              m.photo  !== undefined ? m.photo  : vals[i][4],
              vals[i][5]
            ]]);
            n++;
            break;
          }
        }
      }
      return json_({ ok: true, edited: n });
    }

    if (body.action === 'setStatus') {
      var name = String(body.name || '').trim().toLowerCase();
      var status = String(body.status || 'active').toLowerCase();
      var last = sheet.getLastRow();
      var n = 0;
      if (last > 1) {
        var vals = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
        for (var i = 0; i < vals.length; i++) {
          if (String(vals[i][0]).trim().toLowerCase() === name) {
            sheet.getRange(i + 2, 6).setValue(status);
            n++;
            break;
          }
        }
      }
      return json_({ ok: true, updated: n });
    }

    return json_({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
