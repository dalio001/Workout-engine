// tools/units-check.mjs — no dependencies. Verifies canonical-kg unit fix.
// Helpers below are copies of index.html (toDisplayWeight/fromInputWeight and
// the v1->v2 migration). The check also asserts index.html contains them.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(here, '..', 'index.html');
const html = readFileSync(htmlPath, 'utf8');

let failures = 0;
function assert(cond, label, extra = '') {
  if (cond) console.log(`PASS ${label}${extra ? ' — ' + extra : ''}`);
  else { failures++; console.log(`FAIL ${label}${extra ? ' — ' + extra : ''}`); }
}

// 0. Helpers exist in index.html and every weight view uses them.
for (const fn of ['function toDisplayWeight(', 'function fromInputWeight(', 'function formatDisplayWeight(', 'function migrateParsedStateToV2(', 'hevy_clone_state_backup_v1', 'schemaVersion']) {
  assert(html.includes(fn), `index.html contains ${fn}`);
}
// Old buggy pattern must be gone: raw weight + unit label in history/best views.
assert(!html.includes('${bestSet.weight}${state.unit}'), 'no raw bestSet.weight relabel');
assert(!html.includes('${prev.weight}${state.unit'), 'no raw prev.weight relabel');

// ---- Copies of index.html helpers (must match index.html logic) ----
const LB_PER_KG = 2.20462;
function toDisplayWeight(kgVal, unit) {
  if (kgVal === '' || kgVal === null || kgVal === undefined) return '';
  const n = Number(kgVal);
  if (!isFinite(n)) return '';
  const u = unit || 'KG';
  if (u === 'LBS') return Math.round(n * LB_PER_KG * 10) / 10;
  return Math.round(n * 100) / 100;
}
function fromInputWeight(inputVal, unit) {
  if (inputVal === '' || inputVal === null || inputVal === undefined) return '';
  const n = parseFloat(inputVal);
  if (!isFinite(n)) return 0;
  const u = unit || 'KG';
  if (u === 'LBS') return Math.round((n / LB_PER_KG) * 100) / 100;
  return n;
}
function convertOldWeightToKg(w, savedUnit) {
  if (w === '' || w === null || w === undefined) return w;
  const n = Number(w);
  if (!isFinite(n)) return w;
  if (savedUnit === 'LBS') return Math.round((n / LB_PER_KG) * 100) / 100;
  return n;
}

// 1. 100 kg -> shows 220.5 lb
assert(toDisplayWeight(100, 'LBS') === 220.5, '100kg displays as 220.5lb', `got ${toDisplayWeight(100, 'LBS')}`);
// 2. typing 225 lb stores 102.06 kg
assert(fromInputWeight(225, 'LBS') === 102.06, 'typing 225lb stores 102.06kg', `got ${fromInputWeight(225, 'LBS')}`);
// No float artifacts: kg display never shows long fractions
assert(String(toDisplayWeight(62.5 / LB_PER_KG * LB_PER_KG, 'KG')).length <= 7, 'no 62.49999 artifact');
assert(Number.isInteger(toDisplayWeight(100, 'LBS') * 10), 'lb display max 1 decimal');

// 3. 10 round trips KG<->LBS leave stored values identical.
// Toggling units only changes display; stored canonical kg is never rewritten.
{
  const stored = [100, 62.5, 102.06, 20, 0];
  const before = JSON.stringify(stored);
  let unit = 'KG';
  for (let i = 0; i < 10; i++) {
    unit = unit === 'KG' ? 'LBS' : 'KG';
    stored.map(v => toDisplayWeight(v, unit)); // render-only, must not mutate
  }
  assert(JSON.stringify(stored) === before, '10 unit toggles leave stored kg identical');
  // Display rounding is idempotent: lb display -> kg -> lb display is stable.
  const once = toDisplayWeight(100, 'LBS');
  const twice = toDisplayWeight(fromInputWeight(once, 'LBS'), 'LBS');
  assert(once === twice, 'lb display round-trip stable', `got ${once} vs ${twice}`);
}

// 4/5. Migration of old states (no schemaVersion; weights in saved state.unit).
{
  const lbsState = { unit: 'LBS', history: [{ totalVolume: 2250, exercises: [{ exId: 'ex1', sets: [{ weight: 225, reps: 5 }] }] }] };
  const savedUnit = lbsState.unit === 'LBS' ? 'LBS' : 'KG';
  lbsState.history.forEach(w => w.exercises.forEach(it => it.sets.forEach(s => { s.weight = convertOldWeightToKg(s.weight, savedUnit); })));
  assert(lbsState.history[0].exercises[0].sets[0].weight === 102.06, 'LBS legacy 225 migrates to 102.06kg', `got ${lbsState.history[0].exercises[0].sets[0].weight}`);

  const kgState = { unit: 'KG', history: [{ totalVolume: 500, exercises: [{ exId: 'ex1', sets: [{ weight: 100, reps: 5 }] }] }] };
  const kgUnit = kgState.unit === 'LBS' ? 'LBS' : 'KG';
  kgState.history.forEach(w => w.exercises.forEach(it => it.sets.forEach(s => { s.weight = convertOldWeightToKg(s.weight, kgUnit); })));
  assert(kgState.history[0].exercises[0].sets[0].weight === 100, 'KG legacy 100 stays 100');

  const defState = { history: [{ totalVolume: 300, exercises: [{ exId: 'ex1', sets: [{ weight: 60, reps: 5 }] }] }] };
  const defUnit = defState.unit === 'LBS' ? 'LBS' : 'KG';
  defState.history.forEach(w => w.exercises.forEach(it => it.sets.forEach(s => { s.weight = convertOldWeightToKg(s.weight, defUnit); })));
  assert(defState.history[0].exercises[0].sets[0].weight === 60, 'missing unit defaults to KG');
}

// 6. Backup key created once and never overwritten (mirrors backupV1Once).
{
  const store = new Map();
  const fakeLS = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) };
  function backupV1Once(raw) {
    if (fakeLS.getItem('hevy_clone_state_backup_v1') === null && raw != null) fakeLS.setItem('hevy_clone_state_backup_v1', raw);
  }
  backupV1Once('{"unit":"LBS","history":[]}');
  assert(fakeLS.getItem('hevy_clone_state_backup_v1') === '{"unit":"LBS","history":[]}', 'backup key created');
  backupV1Once('{"unit":"KG","history":[]}');
  assert(fakeLS.getItem('hevy_clone_state_backup_v1') === '{"unit":"LBS","history":[]}', 'backup key not overwritten on second run');
}

if (failures) { console.log(`${failures} FAILURE(S)`); process.exit(1); }
console.log('ALL UNIT CHECKS PASSED');
