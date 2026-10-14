// tests/harness.mjs — zero-dependency test harness (P0-06, personal scale).
//
// Runs the REAL <script> from index.html inside node:vm with a small fake
// browser (in-memory localStorage, minimal document/element stubs,
// alert/confirm stubs, no-op timers). No copies of app functions: the script
// source is extracted from index.html and executed as-is, then the app's own
// globals are exposed through `globalThis.__app` (appended to the same
// script so it can close over the app's let/const bindings).
//
// If a function cannot run without a real DOM, only the missing piece is
// stubbed (see makeElement/makeDocument below). Nothing else is mocked.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, '..');
export const INDEX_HTML_PATH = path.join(REPO_ROOT, 'index.html');
export const SW_PATH = path.join(REPO_ROOT, 'sw.js');
export const MANIFEST_PATH = path.join(REPO_ROOT, 'manifest.webmanifest');

export const STATE_KEY = 'hevy_clone_state';
export const DRAFT_KEY = 'hevy_clone_active_session';
export const BACKUP_V1_KEY = 'hevy_clone_state_backup_v1';
export const BEFORE_RESTORE_KEY = 'hevy_clone_state_before_restore';

export function loadIndexHtml() {
  return readFileSync(INDEX_HTML_PATH, 'utf8');
}

export function extractScript(html) {
  const matches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  if (matches.length === 0) throw new Error('no <script> block found in index.html');
  if (matches.length > 1) throw new Error(`expected 1 <script> block, found ${matches.length}`);
  return matches[0][1];
}

export function loadAppScript() {
  return extractScript(loadIndexHtml());
}

// ---- Fake browser -------------------------------------------------------

function makeClassList() {
  const s = new Set();
  return {
    add(...c) { c.forEach((x) => s.add(x)); },
    remove(...c) { c.forEach((x) => s.delete(x)); },
    contains(c) { return s.has(c); },
    toggle(c) {
      if (s.has(c)) { s.delete(c); return false; }
      s.add(c); return true;
    },
  };
}

// Minimal element stub: accepts innerHTML/value/classList/style/
// addEventListener and nothing else. Enough for every render path in
// index.html (routines, history, stats, drawer, modals, banners).
export function makeElement(tag = 'div') {
  return {
    tagName: String(tag).toUpperCase(),
    innerHTML: '',
    innerText: '',
    textContent: '',
    value: '',
    checked: false,
    style: {},
    dataset: {},
    children: [],
    classList: makeClassList(),
    appendChild(c) { this.children.push(c); return c; },
    addEventListener() {},
    removeEventListener() {},
    click() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
}

export function makeDocument() {
  const byId = new Map();
  return {
    _byId: byId,
    getElementById(id) {
      if (!byId.has(id)) byId.set(id, makeElement());
      return byId.get(id);
    },
    createElement(tag) { return makeElement(tag); },
    // confirmRestore/showRestorePreview guard null, so null is faithful.
    querySelector() { return null; },
    // switchTab() indexes [1] and forEach()es; two stubs keep that path real.
    querySelectorAll() { return [makeElement(), makeElement()]; },
  };
}

// In-memory localStorage. The backing Map can be shared between app
// instances to simulate a reload (same device, fresh JS context).
export function makeLocalStorage(store) {
  return {
    getItem(k) {
      const key = String(k);
      return store.has(key) ? store.get(key) : null;
    },
    setItem(k, v) { store.set(String(k), String(v)); },
    removeItem(k) { store.delete(String(k)); },
    clear() { store.clear(); },
    get length() { return store.size; },
    key(i) { return [...store.keys()][i] ?? null; },
  };
}

const EXPORT_SNIPPET = `;globalThis.__app = {
  get state(){ return state; }, set state(v){ state = v; },
  get activeWorkout(){ return activeWorkout; }, set activeWorkout(v){ activeWorkout = v; },
  get restDeadline(){ return restDeadline; }, set restDeadline(v){ restDeadline = v; },
  get restRemaining(){ return restRemaining; },
  get pendingRestore(){ return pendingRestore; }, set pendingRestore(v){ pendingRestore = v; },
  get setInputErrors(){ return setInputErrors; }, set setInputErrors(v){ setInputErrors = v; },
  get finishReviewPending(){ return finishReviewPending; }, set finishReviewPending(v){ finishReviewPending = v; },
  get restPickerTarget(){ return restPickerTarget; }, set restPickerTarget(v){ restPickerTarget = v; },
  get tempRoutineExercises(){ return tempRoutineExercises; },
  get editingRoutineId(){ return editingRoutineId; },
  get deletedRoutineBackup(){ return deletedRoutineBackup; },
  get pendingRoutineUpdate(){ return pendingRoutineUpdate; },
  DEFAULT_EXERCISES, DEFAULT_ROUTINES,
  SCHEMA_VERSION, LB_PER_KG, SET_MAX_WEIGHT_KG, SET_MAX_REPS, REST_OPTIONS,
  toDisplayWeight, fromInputWeight, formatDisplayWeight, toDisplayVolume,
  getWeightErrorKg, getRepsError, isSetTickable,
  getExerciseRestSec, setExerciseRest, openRestPicker, pickRestOption, formatRestLabel,
  countUntickedSets, countDoneValidSets,
  finishReviewTickAll, finishReviewDrop, finishReviewBack, doFinishSave,
  startRoutineWorkout, doStartRoutineWorkout, startEmptyWorkout,
  renderRoutines, openRoutineBuilder, editRoutine, saveRoutine,
  deleteRoutine, undoDeleteRoutine, expireDeletedRoutine,
  duplicateRoutine, moveRoutine,
  normalizeRoutineItem, parseRepsTarget, formatRepsTarget,
  updateBuilderSets, updateBuilderReps, updateBuilderWeight, updateBuilderNote,
  moveBuilderExercise, removeBuilderExercise, openBuilderRestPicker, setBuilderRest,
  confirmRoutineUpdate, declineRoutineUpdate,
  updateSetVal, toggleSetDone, addSetToActive, finishWorkout, discardWorkout,
  toggleUnit, getBest1RM, getPreviousSet,
  loadActiveSessionDraft, loadActiveSessionDraftRaw, resumeSavedWorkout, discardSavedDraft,
  saveState,
  migrateParsedStateToV2, applySeedDefaults,
  validateBackupData, describeRestoreSummary, showRestorePreview,
  cancelRestore, confirmRestore, undoLastRestore,
};`;

// Creates one app instance: runs init() (the script self-initializes) in a
// fresh JS context. Pass the same `store` Map to simulate a reload.
export function createApp(options = {}) {
  const store = options.store || new Map();
  const document = makeDocument();
  const alerts = [];
  const confirms = [];
  let confirmResult = options.confirmResult !== undefined ? options.confirmResult : true;

  const sandbox = {
    console,
    localStorage: makeLocalStorage(store),
    document,
    window: { addEventListener() {} },
    navigator: {},
    alert: (msg) => { alerts.push(String(msg)); },
    confirm: (msg) => { confirms.push(String(msg)); return confirmResult; },
    // Timers must not keep the test process alive; the app stores absolute
    // deadlines (restDeadline), so no ticking is needed for assertions.
    setInterval: () => 0,
    clearInterval: () => {},
    setTimeout: () => 0,
    clearTimeout: () => {},
    Blob: function Blob() {},
    URL: { createObjectURL: () => 'blob:fake', revokeObjectURL: () => {} },
    FileReader: function FileReader() {},
  };
  vm.createContext(sandbox);
  const src = options.scriptSrc || loadAppScript();
  vm.runInContext(src + EXPORT_SNIPPET, sandbox, { filename: 'index.html<script>' });

  return {
    store,
    document,
    alerts,
    confirms,
    setConfirmResult(v) { confirmResult = v; },
    api: sandbox.__app,
    el: (id) => document.getElementById(id),
    stateJson() { return JSON.stringify(sandbox.__app.state); },
  };
}
