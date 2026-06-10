/**
 * AlpasPinas — Unified Team Management
 * ------------------------------------------------------------------
 * Manages: Roster, User Authentication, and Applications
 *
 * Tabs (auto-created):
 *   - Roster: Name | Role | Side | Joined | Photo | Status
 *   - Users: Mobile | Name | Email | Birthday | Password | Status | CreatedAt
 *   - Applications: Mobile | Name | Email | Status | CreatedAt | RejectionReason
 *   - Tokens: Token | Mobile | Email | Name | ExpiresAt | Used
 *
 * Deploy: Extensions -> Apps Script -> paste this -> Deploy ->
 *         New deployment -> Web app -> Execute as: Me,
 *         Who has access: Anyone -> copy the /exec URL.
 * Set VITE_ROSTER_ENDPOINT to the /exec URL in .env
 */

// Sheet names and headers
var ROSTER_SHEET = 'Roster';
var ROSTER_HEADERS = ['Name', 'Role', 'Side', 'Joined', 'Photo', 'Status'];

var USERS_SHEET = 'Users';
var USERS_HEADERS = ['Mobile', 'Name', 'Email', 'Birthday', 'Password', 'Status', 'CreatedAt'];

var APPS_SHEET = 'Applications';
var APPS_HEADERS = ['Mobile', 'Name', 'Email', 'Status', 'CreatedAt', 'RejectionReason'];

var TOKENS_SHEET = 'Tokens';
var TOKENS_HEADERS = ['Token', 'Mobile', 'Email', 'Name', 'ExpiresAt', 'Used'];

var ADMIN_EMAIL = 'admin@alpaspinas.com';
var APP_BASE_URL = 'http://localhost:5173'; // Change to https://alpaspinas.my for production

function getSheet_(sheetName, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getRosterSheet_() {
  return getSheet_(ROSTER_SHEET, ROSTER_HEADERS);
}

function getUsersSheet_() {
  return getSheet_(USERS_SHEET, USERS_HEADERS);
}

function getApplicationsSheet_() {
  return getSheet_(APPS_SHEET, APPS_HEADERS);
}

function getTokensSheet_() {
  return getSheet_(TOKENS_SHEET, TOKENS_HEADERS);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function generateToken_() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var token = '';
  for (var i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

function sendRegistrationEmail_(email, name, token) {
  try {
    var subject = 'AlpasPinas — Complete Your Registration';
    var registrationLink = APP_BASE_URL + '/register?token=' + encodeURIComponent(token);
    var body = 'Hi ' + name + ',\n\n' +
              'Welcome to AlpasPinas! Your application has been approved.\n\n' +
              'Click the link below to complete your registration and set your password:\n' +
              registrationLink + '\n\n' +
              'This link will expire in 7 days.\n\n' +
              'See you on the water!\n' +
              'AlpasPinas Team';

    GmailApp.sendEmail(email, subject, body, {
      from: ADMIN_EMAIL,
      name: 'AlpasPinas Admin'
    });
    return true;
  } catch (err) {
    Logger.log('Email error: ' + err);
    return false;
  }
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
      var rows = sheet.getRange(2, 1, last - 1, ROSTER_HEADERS.length).getValues();
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
 * Roster actions:
 *   { action: 'add',    member: { name, role, side, joined, photo? } }
 *   { action: 'remove', name: '...' }
 *   { action: 'edit', originalName, member: {...} }
 *   { action: 'setStatus', name, status }
 *
 * User/Application actions:
 *   { action: 'submitApplication', mobile, name, email }
 *   { action: 'approveApplication', mobile }
 *   { action: 'rejectApplication', mobile, reason }
 *   { action: 'getApplications' }
 *   { action: 'registerWithToken', token, password, birthday? }
 *   { action: 'login', mobile, password }
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var body = JSON.parse(e.postData.contents);

    // Roster actions
    if (body.action === 'add') {
      return handleRosterAdd_(body);
    }
    if (body.action === 'remove') {
      return handleRosterRemove_(body);
    }
    if (body.action === 'edit') {
      return handleRosterEdit_(body);
    }
    if (body.action === 'setStatus') {
      return handleRosterSetStatus_(body);
    }

    // User/Application actions
    if (body.action === 'submitApplication') {
      return handleSubmitApplication_(body);
    }
    if (body.action === 'approveApplication') {
      return handleApproveApplication_(body);
    }
    if (body.action === 'rejectApplication') {
      return handleRejectApplication_(body);
    }
    if (body.action === 'getApplications') {
      return handleGetApplications_(body);
    }
    if (body.action === 'registerWithToken') {
      return handleRegisterWithToken_(body);
    }
    if (body.action === 'login') {
      return handleLogin_(body);
    }

    return json_({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ======================== ROSTER ACTIONS ======================== */

function handleRosterAdd_(body) {
  var sheet = getRosterSheet_();
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

function handleRosterRemove_(body) {
  var sheet = getRosterSheet_();
  var name = String(body.name || '').trim().toLowerCase();
  var last = sheet.getLastRow();
  var n = 0;
  if (last > 1) {
    var vals = sheet.getRange(2, 1, last - 1, ROSTER_HEADERS.length).getValues();
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

function handleRosterEdit_(body) {
  var sheet = getRosterSheet_();
  var originalName = String(body.originalName || '').trim().toLowerCase();
  var m = body.member || {};
  var last = sheet.getLastRow();
  var n = 0;
  if (last > 1) {
    var vals = sheet.getRange(2, 1, last - 1, ROSTER_HEADERS.length).getValues();
    for (var i = 0; i < vals.length; i++) {
      if (String(vals[i][0]).trim().toLowerCase() === originalName) {
        sheet.getRange(i + 2, 1, 1, ROSTER_HEADERS.length).setValues([[
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

function handleRosterSetStatus_(body) {
  var sheet = getRosterSheet_();
  var name = String(body.name || '').trim().toLowerCase();
  var status = String(body.status || 'active').toLowerCase();
  var last = sheet.getLastRow();
  var n = 0;
  if (last > 1) {
    var vals = sheet.getRange(2, 1, last - 1, ROSTER_HEADERS.length).getValues();
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

/* ======================== APPLICATION ACTIONS ======================== */

function handleSubmitApplication_(body) {
  var mobile = String(body.mobile || '').trim();
  var name = String(body.name || '').trim();
  var email = String(body.email || '').trim();

  if (!mobile || !name || !email) {
    return json_({ ok: false, error: 'Mobile, name, and email are required.' });
  }

  var appsSheet = getApplicationsSheet_();
  var now = new Date();

  // Check for duplicate application
  var last = appsSheet.getLastRow();
  if (last > 1) {
    var vals = appsSheet.getRange(2, 1, last - 1, APPS_HEADERS.length).getValues();
    for (var i = 0; i < vals.length; i++) {
      if (String(vals[i][0]).trim() === mobile) {
        var status = String(vals[i][3] || '').toLowerCase();
        if (status === 'pending') {
          return json_({ ok: false, error: 'You already have a pending application.' });
        }
      }
    }
  }

  appsSheet.appendRow([mobile, name, email, 'pending', now.toISOString(), '']);

  return json_({
    ok: true,
    message: 'Application submitted successfully. Please check your email for updates.'
  });
}

function handleApproveApplication_(body) {
  var mobile = String(body.mobile || '').trim();
  var token = generateToken_();
  var now = new Date();
  var expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  var appsSheet = getApplicationsSheet_();
  var tokensSheet = getTokensSheet_();

  // Find application
  var last = appsSheet.getLastRow();
  var appData = null;
  var appRow = -1;

  if (last > 1) {
    var vals = appsSheet.getRange(2, 1, last - 1, APPS_HEADERS.length).getValues();
    for (var i = 0; i < vals.length; i++) {
      if (String(vals[i][0]).trim() === mobile) {
        appData = vals[i];
        appRow = i + 2;
        break;
      }
    }
  }

  if (!appData) {
    return json_({ ok: false, error: 'Application not found.' });
  }

  var email = String(appData[2] || '');
  var name = String(appData[1] || '');

  appsSheet.getRange(appRow, 4).setValue('approved');
  tokensSheet.appendRow([token, mobile, email, name, expiresAt.toISOString(), false]);

  var emailSent = sendRegistrationEmail_(email, name, token);

  return json_({
    ok: true,
    message: 'Application approved. Registration email sent to ' + email,
    emailSent: emailSent
  });
}

function handleRejectApplication_(body) {
  var mobile = String(body.mobile || '').trim();
  var reason = String(body.reason || '').trim();

  var appsSheet = getApplicationsSheet_();

  // Find application
  var last = appsSheet.getLastRow();
  var appRow = -1;

  if (last > 1) {
    var vals = appsSheet.getRange(2, 1, last - 1, APPS_HEADERS.length).getValues();
    for (var i = 0; i < vals.length; i++) {
      if (String(vals[i][0]).trim() === mobile) {
        appRow = i + 2;
        break;
      }
    }
  }

  if (appRow === -1) {
    return json_({ ok: false, error: 'Application not found.' });
  }

  appsSheet.getRange(appRow, 4).setValue('rejected');
  appsSheet.getRange(appRow, 6).setValue(reason);

  return json_({
    ok: true,
    message: 'Application rejected.'
  });
}

function handleGetApplications_(body) {
  var appsSheet = getApplicationsSheet_();
  var last = appsSheet.getLastRow();
  var applications = [];

  if (last > 1) {
    var vals = appsSheet.getRange(2, 1, last - 1, APPS_HEADERS.length).getValues();
    for (var i = 0; i < vals.length; i++) {
      applications.push({
        mobile: String(vals[i][0] || ''),
        name: String(vals[i][1] || ''),
        email: String(vals[i][2] || ''),
        status: String(vals[i][3] || ''),
        createdAt: vals[i][4] ? new Date(vals[i][4]).toISOString() : '',
        rejectionReason: String(vals[i][5] || '')
      });
    }
  }

  return json_({
    ok: true,
    applications: applications
  });
}

function handleRegisterWithToken_(body) {
  var token = String(body.token || '').trim();
  var password = String(body.password || '').trim();
  var birthday = String(body.birthday || '').trim();

  if (!token || !password) {
    return json_({ ok: false, error: 'Token and password are required.' });
  }

  if (password.length < 6) {
    return json_({ ok: false, error: 'Password must be at least 6 characters.' });
  }

  var tokensSheet = getTokensSheet_();
  var last = tokensSheet.getLastRow();
  var tokenData = null;
  var tokenRow = -1;

  if (last > 1) {
    var vals = tokensSheet.getRange(2, 1, last - 1, TOKENS_HEADERS.length).getValues();
    for (var i = 0; i < vals.length; i++) {
      if (String(vals[i][0]).trim() === token) {
        tokenData = vals[i];
        tokenRow = i + 2;
        break;
      }
    }
  }

  if (!tokenData) {
    return json_({ ok: false, error: 'Invalid or expired token.' });
  }

  var used = Boolean(tokenData[5]);
  if (used) {
    return json_({ ok: false, error: 'This token has already been used.' });
  }

  var expiresAt = new Date(tokenData[4]);
  if (new Date() > expiresAt) {
    return json_({ ok: false, error: 'Token has expired.' });
  }

  var mobile = String(tokenData[1] || '');
  var email = String(tokenData[2] || '');
  var name = String(tokenData[3] || '');

  // Check for existing user
  var usersSheet = getUsersSheet_();
  var usersLast = usersSheet.getLastRow();
  if (usersLast > 1) {
    var userVals = usersSheet.getRange(2, 1, usersLast - 1, USERS_HEADERS.length).getValues();
    for (var j = 0; j < userVals.length; j++) {
      if (String(userVals[j][0]).trim() === mobile) {
        return json_({ ok: false, error: 'User already registered.' });
      }
    }
  }

  // Create user account
  var now = new Date();
  usersSheet.appendRow([
    mobile,
    name,
    email,
    birthday || '',
    password,
    'active',
    now.toISOString()
  ]);

  // Mark token as used
  tokensSheet.getRange(tokenRow, 6).setValue(true);

  return json_({
    ok: true,
    user: {
      mobile: mobile,
      name: name,
      email: email,
      birthday: birthday || null,
      createdAt: now.toISOString()
    }
  });
}

function handleLogin_(body) {
  var mobile = String(body.mobile || '').trim();
  var password = String(body.password || '').trim();

  if (!mobile || !password) {
    return json_({ ok: false, error: 'Mobile and password are required.' });
  }

  var sheet = getUsersSheet_();
  var last = sheet.getLastRow();

  if (last > 1) {
    var vals = sheet.getRange(2, 1, last - 1, USERS_HEADERS.length).getValues();
    for (var i = 0; i < vals.length; i++) {
      var storedMobile = String(vals[i][0]).trim();
      var storedPassword = String(vals[i][4]).trim();
      var status = String(vals[i][5] || 'active').toLowerCase();

      if (storedMobile === mobile) {
        if (storedPassword === password && status === 'active') {
          return json_({
            ok: true,
            user: {
              mobile: storedMobile,
              name: String(vals[i][1] || ''),
              email: String(vals[i][2] || '') || null,
              birthday: String(vals[i][3] || '') || null,
              createdAt: vals[i][6] ? new Date(vals[i][6]).toISOString() : new Date().toISOString()
            }
          });
        } else {
          return json_({ ok: false, error: 'Invalid mobile or password.' });
        }
      }
    }
  }

  return json_({ ok: false, error: 'Invalid mobile or password.' });
}
