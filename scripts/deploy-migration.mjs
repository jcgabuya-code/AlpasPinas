#!/usr/bin/env node
// ============================================================================
// deploy-migration.mjs — apply a migration over HTTPS (Management API)
// ============================================================================
// Why this exists: this Mac's network blocks outbound Postgres ports 5432/6543,
// so `supabase db push` hangs at "Initialising login role…". This script runs
// the migration SQL through the Supabase Management API over plain HTTPS instead,
// then records the version in supabase_migrations.schema_migrations so a normal
// `db push` elsewhere (e.g. the GitHub Action) stays in sync.
//
// Auth: uses the Supabase CLI login token from the macOS keychain
//   (security find-generic-password -s "Supabase CLI" -w).
//   Run `supabase login` once if it's missing.
//
// Usage (from project root):
//   node scripts/deploy-migration.mjs                      # newest migration
//   node scripts/deploy-migration.mjs 20260625000000_merch # by name (no .sql)
//   node scripts/deploy-migration.mjs path/to/file.sql     # explicit path
//   DRY_RUN=1 node scripts/deploy-migration.mjs            # print, don't apply
// ============================================================================

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, basename } from 'node:path';

const MIGRATIONS_DIR = resolve('supabase/migrations');
const REF_FILE = resolve('supabase/.temp/project-ref');
const API = 'https://api.supabase.com';

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

// --- project ref ------------------------------------------------------------
if (!existsSync(REF_FILE)) {
  fail(`Project ref not found at ${REF_FILE}. Run \`supabase link\` first.`);
}
const projectRef = readFileSync(REF_FILE, 'utf8').trim();

// --- keychain token ---------------------------------------------------------
let token;
try {
  token = execFileSync(
    'security',
    ['find-generic-password', '-s', 'Supabase CLI', '-w'],
    { encoding: 'utf8' },
  ).trim();
} catch {
  fail('Could not read the Supabase CLI token from the keychain. Run `supabase login` once, then retry.');
}
if (!token) fail('Supabase CLI token was empty. Run `supabase login`.');

// --- resolve the migration file ---------------------------------------------
function resolveMigration(arg) {
  if (arg) {
    if (arg.endsWith('.sql') && existsSync(resolve(arg))) return resolve(arg);
    const byName = resolve(MIGRATIONS_DIR, arg.endsWith('.sql') ? arg : `${arg}.sql`);
    if (existsSync(byName)) return byName;
    // allow a bare version/prefix match
    const match = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql') && f.startsWith(arg))
      .sort();
    if (match.length === 1) return resolve(MIGRATIONS_DIR, match[0]);
    if (match.length > 1) fail(`Ambiguous migration "${arg}": ${match.join(', ')}`);
    fail(`No migration matched "${arg}".`);
  }
  // default: newest migration by filename
  const all = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  if (!all.length) fail('No migrations found.');
  return resolve(MIGRATIONS_DIR, all[all.length - 1]);
}

const migrationPath = resolveMigration(process.argv[2]);
const fileName = basename(migrationPath);
const version = fileName.split('_')[0]; // e.g. 20260625000000
if (!/^\d{14}$/.test(version)) {
  fail(`Could not parse a 14-digit version from "${fileName}".`);
}
const sql = readFileSync(migrationPath, 'utf8');

console.log(`Project : ${projectRef}`);
console.log(`File    : ${fileName}`);
console.log(`Version : ${version}`);
console.log(`SQL     : ${sql.length} chars`);

if (process.env.DRY_RUN) {
  console.log('\n[DRY_RUN] Not applying. SQL above would be POSTed to the Management API.');
  process.exit(0);
}

// --- run a query via the Management API -------------------------------------
async function runQuery(query, label) {
  const res = await fetch(`${API}/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) {
    fail(`${label} failed (HTTP ${res.status}):\n${text}`);
  }
  return text;
}

// --- apply ------------------------------------------------------------------
console.log('\n→ Applying migration SQL…');
await runQuery(sql, 'Migration');
console.log('  ✓ applied');

console.log('→ Recording version in supabase_migrations.schema_migrations…');
const record = `
  insert into supabase_migrations.schema_migrations (version, name)
  values ('${version}', '${fileName.replace(/\.sql$/, '').replace(`${version}_`, '')}')
  on conflict (version) do nothing;
`;
await runQuery(record, 'Version record');
console.log('  ✓ recorded');

console.log('\n✓ Done. Verify in the Supabase dashboard or with a quick select.');
