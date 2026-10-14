// tools/restore-check.mjs — no dependencies. Verifies the P0-03 safe restore.
// Loads the real validation/migration functions out of index.html (single
// source of truth: function/const sources are extracted and evaluated, never
// copied), then asserts the required behaviors.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(here, '..', 'index.html');
const html = readFileSync(htmlPath, 'utf8');

let failures = 0;
function assert(cond, label, extra = '') {
  if (cond) console.log(`PASS ${label}${extra ? ' — ' + extra : ''}`);
  else { failures++; console.log(`FAIL ${label}${extra ? ' — ' + extra : ''}`); }
}

// ---- 0. Required wiring exists in index.html ----
for (const s of [
  'function validateBackupData(',
  'function applySeedDefaults(',
  'function confirmRestore(',
  'function undoLastRestore(',
  'function showRestorePreview(',
  'hevy_clone_state_before_restore',
  'id="restoreModal"',
  'Undo last restore',
  'id="restoreDoneBanner"',
  'name="restoreDraft"',
]) {
  assert(html.includes(s), `index.html contains ${s}`);
}
// Old unsafe behavior must be gone: replace-then-save with no validation,
// reseed-on-empty in init(), and the misleading success message.
assert(!html.includes("if (!state.exercises || state.exercises.length === 0) state.exercises = DEFAULT_EXERCISES;"), 'no unconditional exercise reseed');
assert(!html.includes("if (!state.routines || state.routines.length === 0) state.routines = DEFAULT_ROUTINES;"), 'no unconditional routine reseed');
assert(!html.includes('Workout history & routines restored!'), 'old blind success message gone');

// ---- Load real functions from index.html ----
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert(scriptMatch !== null, 'extracted <script> from index.html');
const script = scriptMatch[1];

// Balanced-delimiter scanner that skips strings, template literals and comments.
function scanBalanced(src, startIdx, open, close) {
  let i = startIdx;
  let depth = 0;
  let state = 'code';
  let quote = '';
  while (i < src.length) {
    const ch = src[i];
    const next = src[i + 1];
    if (state === 'code') {
      if (ch === '/' && next === '/') { state = 'line'; i += 2; continue; }
      if (ch === '/' && next === '*') { state = 'block'; i += 2; continue; }
      if (ch === "'" || ch === '"' || ch === '`') { state = 'str'; quote = ch; i++; continue; }
      if (ch === open) depth++;
      else if (ch === close) { depth--; if (depth === 0) return i; }
      i++;
    } else if (state === 'line') {
      if (ch === '\n') state = 'code';
      i++;
    } else if (state === 'block') {
      if (ch === '*' && next === '/') { state = 'code'; i += 2; } else i++;
    } else if (state === 'str') {
      if (ch === '\\') i += 2;
      else if (ch === quote) { state = 'code'; i++; }
      else i++;
    }
  }
  throw new Error('unbalanced delimiters');
}

function extractFunction(src, name) {
  const marker = 'function ' + name + '(';
  const idx = src.indexOf(marker);
  if (idx === -1) throw new Error('function not found: ' + name);
  const brace = src.indexOf('{', idx);
  const end = scanBalanced(src, brace, '{', '}');
  return src.slice(idx, end + 1);
}

function extractConst(src, name) {
  const marker = 'const ' + name + ' =';
  const idx = src.indexOf(marker);
  if (idx === -1) throw new Error('const not found: ' + name);
  const afterEq = src.indexOf('=', idx) + 1;
  let j = afterEq;
  while (/\s/.test(src[j])) j++;
  const first = src[j];
  let end;
  if (first === '[') end = scanBalanced(src, j, '[', ']');
  else if (first === '{') end = scanBalanced(src, j, '{', '}');
  else end = src.indexOf(';', j) - 1;
  return src.slice(idx, src.indexOf(';', end) + 1);
}

const wantedFns = [
  'isPlainObject', 'cloneForRestore', 'restoreNum',
  'convertOldWeightToKg', 'migrateHistoryWeightsToKg', 'migrateParsedStateToV2',
  'applySeedDefaults', 'validateBackupData',
];
const wantedConsts = [
  'SCHEMA_VERSION', 'LB_PER_KG', 'DEFAULT_EXERCISES', 'DEFAULT_ROUTINES',
  'RESTORE_MAX_WEIGHT_KG', 'RESTORE_MAX_REPS',
];
let composed = '';
for (const c of wantedConsts) composed += extractConst(script, c) + '\n';
for (const f of wantedFns) composed += extractFunction(script, f) + '\n';
composed += 'globalThis.__loaded = { validateBackupData, migrateParsedStateToV2, applySeedDefaults, DEFAULT_EXERCISES, DEFAULT_ROUTINES };';

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(composed, sandbox, { filename: 'index.html-script-extract' });
const { validateBackupData, migrateParsedStateToV2, applySeedDefaults, DEFAULT_EXERCISES, DEFAULT_ROUTINES } = sandbox.__loaded;
assert(typeof validateBackupData === 'function', 'loaded validateBackupData from index.html');
assert(typeof applySeedDefaults === 'function', 'loaded applySeedDefaults from index.html');

// ---- 1. {"note":"x"} rejected, nothing accepted ----
{
  const r = validateBackupData({ note: 'x' });
  assert(r.ok === false, 'junk file rejected');
  assert(/not a PLZ FitZone backup/.test(r.error || ''), 'junk error names backup', `got: ${r.error}`);
}

// ---- 2. history with weight "abc" rejected ----
function baseBackup() {
  return {
    schemaVersion: 2,
    unit: 'KG',
    defaultRest: 90,
    exercises: [{ id: 'ex1', name: 'Bench Press (Barbell)', muscle: 'Chest' }],
    routines: [],
    history: [],
  };
}
{
  const b = baseBackup();
  b.history = [{ id: 'wk1', title: 'W', date: 1728000000000, durationSec: 60, totalVolume: 0, totalSets: 1, exercises: [{ exId: 'ex1', sets: [{ weight: 'abc', reps: 5 }] }] }];
  const r = validateBackupData(b);
  assert(r.ok === false, 'weight "abc" rejected', `got: ${r.error}`);
}

// ---- 3. negative reps rejected ----
{
  const b = baseBackup();
  b.history = [{ id: 'wk1', title: 'W', date: 1728000000000, durationSec: 60, totalVolume: 0, totalSets: 1, exercises: [{ exId: 'ex1', sets: [{ weight: 100, reps: -3 }] }] }];
  const r = validateBackupData(b);
  assert(r.ok === false, 'negative reps rejected', `got: ${r.error}`);
}

// ---- bonus bounds: absurd weight / reps / unknown refs rejected ----
{
  const b = baseBackup();
  b.history = [{ id: 'wk1', title: 'W', date: 1728000000000, durationSec: 60, totalVolume: 0, totalSets: 1, exercises: [{ exId: 'ex1', sets: [{ weight: 2000, reps: 5 }] }] }];
  assert(validateBackupData(b).ok === false, 'weight > 1000kg rejected');
  const b2 = baseBackup();
  b2.history = [{ id: 'wk1', title: 'W', date: 1728000000000, durationSec: 60, totalVolume: 0, totalSets: 1, exercises: [{ exId: 'ex1', sets: [{ weight: 100, reps: 1001 }] }] }];
  assert(validateBackupData(b2).ok === false, 'reps > 1000 rejected');
  const b3 = baseBackup();
  b3.history = [{ id: 'wk1', title: 'W', date: 1728000000000, durationSec: 60, totalVolume: 0, totalSets: 1, exercises: [{ exId: 'ex_ghost', sets: [{ weight: 100, reps: 5 }] }] }];
  const r3 = validateBackupData(b3);
  assert(r3.ok === false && /Unknown exercises referenced: ex_ghost/.test(r3.error || ''), 'unknown exId rejected and listed', `got: ${r3.error}`);
}

// ---- 4. valid v2 backup accepted with correct counts and date range ----
{
  const d1 = Date.UTC(2026, 8, 1, 10, 0, 0);
  const d2 = Date.UTC(2026, 9, 10, 18, 30, 0);
  const b = baseBackup();
  b.exercises.push({ id: 'ex7', name: 'Squat (Barbell)', muscle: 'Legs' });
  b.routines = [{ id: 'rt1', name: 'Legs', exercises: [{ exId: 'ex7', sets: 3 }] }];
  b.history = [
    { id: 'wk1', title: 'A', date: d2, durationSec: 3600, totalVolume: 3000, totalSets: 3, exercises: [{ exId: 'ex1', sets: [{ weight: 100, reps: 5 }] }] },
    { id: 'wk2', title: 'B', date: d1, durationSec: 1800, totalVolume: 1500, totalSets: 3, exercises: [{ exId: 'ex7', sets: [{ weight: 120, reps: 5 }] }] },
  ];
  const r = validateBackupData(b);
  assert(r.ok === true, 'valid v2 backup accepted', r.ok ? '' : `got: ${r.error}`);
  assert(r.summary.workouts === 2 && r.summary.routines === 1 && r.summary.exercises === 2, 'summary counts 2/1/2', `got: ${JSON.stringify(r.summary)}`);
  assert(r.summary.firstDate === d1 && r.summary.lastDate === d2, 'date range correct', `got: ${r.summary.firstDate}..${r.summary.lastDate}`);
  assert(r.summary.unit === 'KG', 'unit KG reported');
}

// ---- 5. valid old backup (no schemaVersion, unit LBS) accepted, converted to kg ----
{
  const b = {
    unit: 'LBS',
    defaultRest: 90,
    exercises: [{ id: 'ex1', name: 'Bench Press (Barbell)', muscle: 'Chest' }],
    routines: [],
    history: [{ id: 'wk_old', title: 'Old', date: 1700000000000, durationSec: 3600, totalVolume: 999, totalSets: 1, exercises: [{ exId: 'ex1', sets: [{ weight: 220.462, reps: 5 }] }] }],
  };
  const before = JSON.stringify(b);
  const r = validateBackupData(b);
  assert(r.ok === true, 'old LBS backup accepted', r.ok ? '' : `got: ${r.error}`);
  const gotW = r.data.history[0].exercises[0].sets[0].weight;
  assert(Math.abs(gotW - 100) < 0.011, '220.462lb migrated to 100kg', `got: ${gotW}`);
  assert(r.data.schemaVersion === 2, 'migrated copy stamped schemaVersion 2');
  assert(JSON.stringify(b) === before, 'input object not mutated (migration ran on a copy)');
}

// ---- 6. saved state with routines: [] stays empty (no reseed) ----
{
  const target = { unit: 'KG', exercises: [], routines: [], history: [{ id: 'x' }] };
  applySeedDefaults(target, true);
  assert(Array.isArray(target.routines) && target.routines.length === 0, 'routines [] stays empty after load');
  assert(Array.isArray(target.exercises) && target.exercises.length === 0, 'exercises [] stays empty after load');
}

// ---- 7. first run with no saved state still gets defaults ----
{
  const target = { unit: 'KG', exercises: [], routines: [] };
  applySeedDefaults(target, false);
  assert(target.exercises.length === DEFAULT_EXERCISES.length && DEFAULT_EXERCISES.length > 0, 'first run seeds exercises', `got: ${target.exercises.length}`);
  assert(target.routines.length === DEFAULT_ROUTINES.length && DEFAULT_ROUTINES.length > 0, 'first run seeds routines', `got: ${target.routines.length}`);
}

if (failures) { console.log(`${failures} FAILURE(S)`); process.exit(1); }
console.log('ALL RESTORE CHECKS PASSED');
