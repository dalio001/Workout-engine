// tests/offline.test.mjs — P0-01 offline hardening on the REAL app code.
// 1. The live draft is mirrored into IndexedDB (the tick Android used to eat
//    when it killed the app a few seconds after a save), resume picks the
//    newer of the two copies, finish/discard clear both, and pagehide /
//    visibilitychange-hidden flush the newest tick to both stores.
//    Everything degrades silently when IndexedDB is missing.
// 2. The offline pill, best-effort persistent storage, and the online-only
//    update check.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, makeFakeIndexedDB, DRAFT_KEY } from './harness.mjs';

const DRAFT_DB = 'plz_fitzone_draft';
const DRAFT_STORE = 'drafts';
const MIRROR_KEY = 'active_session';

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

function draftWith(done, savedAt, weight) {
  return {
    title: 'Workout',
    startTime: Date.now() - 60000,
    restDeadline: null,
    routineId: null,
    savedAt: savedAt,
    exercises: [{
      exId: 'ex2',
      restSec: 90,
      note: '',
      sets: [{ type: 'N', weight: weight, reps: 8, done: done }],
    }],
  };
}

describe('P0-01 draft mirror (IndexedDB)', () => {
  it('draft-mirror-written-on-save', async () => {
    const idb = makeFakeIndexedDB();
    const app = createApp({ indexedDB: idb });
    assert.equal(app.api.draftMirrorSupported, true, 'mirror available');

    app.api.startEmptyWorkout();
    app.api.addExerciseToWorkout('ex2');
    app.api.updateSetVal(0, 0, 'weight', '60');
    app.api.updateSetVal(0, 0, 'reps', '6');
    app.api.toggleSetDone(0, 0);
    await app.api.draftMirrorChain;

    const mirrored = idb._dump(DRAFT_DB, DRAFT_STORE).get(MIRROR_KEY);
    assert.ok(mirrored, 'mirror record written');
    assert.equal(typeof mirrored.savedAt, 'number', 'stamped with savedAt');
    assert.equal(mirrored.exercises[0].sets[0].weight, 60, 'mirror has the typed weight');
    assert.equal(mirrored.exercises[0].sets[0].reps, 6, 'mirror has the typed reps');
    assert.equal(mirrored.exercises[0].sets[0].done, true, 'mirror has the tick');
    assert.equal(
      mirrored.savedAt,
      JSON.parse(app.store.get(DRAFT_KEY)).savedAt,
      'both copies carry the same stamp'
    );
  });

  it('resume-picks-newer-of-two-copies', async () => {
    // The mirror is newer: the tick the localStorage copy never got.
    const store = new Map();
    const idb = makeFakeIndexedDB();
    store.set(DRAFT_KEY, JSON.stringify(draftWith(false, 1000, 40)));
    idb._seed(DRAFT_DB, DRAFT_STORE, MIRROR_KEY, draftWith(true, 2000, 40));

    const app = createApp({ store, indexedDB: idb });
    await app.api.draftMirrorReady;
    assert.ok(app.el('resumeModal').classList.contains('open'), 'unfinished workout offered for resume');

    const draft = app.api.loadActiveSessionDraft();
    assert.equal(draft.savedAt, 2000, 'newer mirror copy wins');
    assert.equal(draft.exercises[0].sets[0].done, true, 'the tick lost locally is back');

    app.api.resumeSavedWorkout();
    assert.ok(app.api.activeWorkout, 'workout resumed');
    assert.equal(
      app.api.activeWorkout.exercises[0].sets[0].done,
      true,
      'the resumed workout is the mirrored (newer) one'
    );

    // The local copy is newer: a stale mirror must never win.
    const store2 = new Map();
    const idb2 = makeFakeIndexedDB();
    store2.set(DRAFT_KEY, JSON.stringify(draftWith(true, 5000, 45)));
    idb2._seed(DRAFT_DB, DRAFT_STORE, MIRROR_KEY, draftWith(false, 4000, 45));

    const app2 = createApp({ store: store2, indexedDB: idb2 });
    await app2.api.draftMirrorReady;
    const d2 = app2.api.loadActiveSessionDraft();
    assert.equal(d2.savedAt, 5000, 'newer local copy wins');
    assert.equal(d2.exercises[0].sets[0].done, true, 'the tick kept in localStorage survives');
  });

  it('finish-and-discard-clear-both', async () => {
    const store = new Map();
    const idb = makeFakeIndexedDB();
    const app = createApp({ store, indexedDB: idb });

    app.api.startEmptyWorkout();
    app.api.addExerciseToWorkout('ex2');
    app.api.updateSetVal(0, 0, 'weight', '50');
    app.api.updateSetVal(0, 0, 'reps', '5');
    app.api.toggleSetDone(0, 0);
    await app.api.draftMirrorChain;
    assert.ok(idb._dump(DRAFT_DB, DRAFT_STORE).has(MIRROR_KEY), 'mirror exists before discard');

    app.api.discardWorkout();
    await app.api.draftMirrorChain;
    assert.equal(store.has(DRAFT_KEY), false, 'local copy cleared on discard');
    assert.equal(idb._dump(DRAFT_DB, DRAFT_STORE).has(MIRROR_KEY), false, 'mirror cleared on discard');
    assert.equal(app.api.loadActiveSessionDraft(), null, 'nothing left to resume after discard');

    app.api.startEmptyWorkout();
    app.api.addExerciseToWorkout('ex2');
    app.api.updateSetVal(0, 0, 'weight', '55');
    app.api.updateSetVal(0, 0, 'reps', '5');
    app.api.toggleSetDone(0, 0);
    await app.api.draftMirrorChain;
    assert.ok(idb._dump(DRAFT_DB, DRAFT_STORE).has(MIRROR_KEY), 'mirror exists before finish');

    app.api.finishWorkout();
    if (app.api.finishReviewPending) app.api.finishReviewDrop();
    await app.api.draftMirrorChain;
    assert.equal(app.api.state.history.length, 1, 'workout saved to history');
    assert.equal(store.has(DRAFT_KEY), false, 'local copy cleared on finish');
    assert.equal(idb._dump(DRAFT_DB, DRAFT_STORE).has(MIRROR_KEY), false, 'mirror cleared on finish');
  });

  it('missing-indexeddb-is-ignored', async () => {
    const store = new Map();
    const app = createApp({ store }); // no indexedDB in the JS context at all
    assert.equal(app.api.draftMirrorSupported, false, 'mirror reported unsupported');

    app.api.startEmptyWorkout();
    app.api.addExerciseToWorkout('ex2');
    app.api.updateSetVal(0, 0, 'weight', '40');
    app.api.updateSetVal(0, 0, 'reps', '8');
    app.api.toggleSetDone(0, 0);
    assert.equal(await app.api.draftMirrorChain, false, 'mirror write resolves false, never throws');
    assert.equal(await app.api.draftMirrorReady, null, 'startup mirror read resolves null');

    assert.ok(store.has(DRAFT_KEY), 'localStorage draft still written');
    assert.equal(
      app.api.loadActiveSessionDraft().exercises[0].sets[0].done,
      true,
      'draft still loads and resumes without IndexedDB'
    );
    assert.equal(app.alerts.length, 0, 'nothing surfaced to the owner');
  });

  it('pagehide and hidden visibility flush the newest tick to both stores', async () => {
    const store = new Map();
    const idb = makeFakeIndexedDB();
    const app = createApp({ store, indexedDB: idb, listeners: true });

    app.api.startEmptyWorkout();
    app.api.addExerciseToWorkout('ex2');
    app.api.updateSetVal(0, 0, 'weight', '30');
    app.api.updateSetVal(0, 0, 'reps', '8');
    app.api.toggleSetDone(0, 0);
    await app.api.draftMirrorChain;
    assert.equal(idb._dump(DRAFT_DB, DRAFT_STORE).get(MIRROR_KEY).exercises[0].sets[0].done, true, 'mirror holds the tick');

    // A tick that only exists in memory — exactly the state Android killed.
    app.api.activeWorkout.exercises[0].sets[0].weight = 77;
    assert.notEqual(idb._dump(DRAFT_DB, DRAFT_STORE).get(MIRROR_KEY).exercises[0].sets[0].weight, 77, 'not flushed yet');

    assert.equal(app.fire('pagehide'), 1, 'pagehide flush registered');
    await app.api.draftMirrorChain;
    assert.equal(idb._dump(DRAFT_DB, DRAFT_STORE).get(MIRROR_KEY).exercises[0].sets[0].weight, 77, 'pagehide flushed the mirror');
    assert.equal(JSON.parse(store.get(DRAFT_KEY)).exercises[0].sets[0].weight, 77, 'pagehide flushed localStorage');

    app.api.activeWorkout.exercises[0].sets[0].weight = 88;
    app.document.visibilityState = 'hidden';
    assert.ok(app.fire('visibilitychange') >= 1, 'resume/visibility handlers registered');
    await app.api.draftMirrorChain;
    assert.equal(idb._dump(DRAFT_DB, DRAFT_STORE).get(MIRROR_KEY).exercises[0].sets[0].weight, 88, 'going hidden flushed the mirror');
    assert.equal(JSON.parse(store.get(DRAFT_KEY)).exercises[0].sets[0].weight, 88, 'going hidden flushed localStorage');
  });
});

describe('P0-01 offline pill, persistent storage and update check', () => {
  it('offline pill shows when navigator.onLine is false and hides when true', () => {
    const offline = createApp({ navigator: { onLine: false } });
    assert.equal(offline.el('offlinePill').style.display, 'block', 'pill shown offline');

    const online = createApp({ navigator: { onLine: true } });
    assert.equal(online.el('offlinePill').style.display, 'none', 'pill hidden online');

    const unknown = createApp(); // navigator.onLine is undefined
    assert.equal(unknown.el('offlinePill').style.display, 'none', 'unknown network state stays hidden');
  });

  it('online and offline window events toggle the pill', () => {
    const nav = { onLine: true };
    const app = createApp({ navigator: nav, listeners: true });
    assert.equal(app.el('offlinePill').style.display, 'none', 'starts hidden');

    nav.onLine = false;
    assert.equal(app.fire('offline'), 1, 'offline handler registered');
    assert.equal(app.el('offlinePill').style.display, 'block', 'pill appears on the offline event');

    nav.onLine = true;
    assert.equal(app.fire('online'), 1, 'online handler registered');
    assert.equal(app.el('offlinePill').style.display, 'none', 'pill hides again on the online event');
  });

  it('persist() rejection is ignored and nothing scary is shown', async () => {
    let calls = 0;
    const app = createApp({
      navigator: {
        onLine: true,
        storage: { persist() { calls++; return Promise.reject(new Error('denied by the browser')); } },
      },
    });
    await nextTick();
    assert.equal(calls, 1, 'persistent storage requested once');
    assert.equal(app.alerts.length, 0, 'no alert');
    app.api.startEmptyWorkout();
    assert.ok(app.api.activeWorkout, 'app still usable after a refusal');

    // A refusal that resolves false is just as quiet.
    const app2 = createApp({ navigator: { storage: { persist: () => Promise.resolve(false) } } });
    await nextTick();
    assert.equal(app2.alerts.length, 0, 'resolved refusal is quiet too');

    // No navigator.storage at all (older engines, file://).
    const app3 = createApp({ navigator: {} });
    await nextTick();
    assert.equal(app3.alerts.length, 0, 'missing API is quiet');
  });

  it('update check does nothing offline when fetch rejects (no updateBar, no throw)', async () => {
    const app = createApp({
      location: { protocol: 'https:' },
      fetch: () => Promise.reject(new Error('offline')),
    });
    await nextTick();
    assert.equal(app.document.body.children.length, 0, 'no bar appended to the page');
    assert.equal(app.document._byId.has('updateBar'), false, 'no bar created');
    assert.equal(app.alerts.length, 0, 'silent');
    app.api.startEmptyWorkout();
    assert.ok(app.api.activeWorkout, 'app usable after a failed check');
  });

  it('update check shows the bar when the ETag changes while online', async () => {
    let etag = 'v1';
    const app = createApp({
      location: { protocol: 'https:' },
      listeners: true,
      fetch: () => Promise.resolve({ headers: { get: (k) => (k === 'etag' ? etag : null) } }),
    });
    await nextTick();
    assert.equal(app.document.body.children.length, 0, 'first check only remembers the ETag');

    etag = 'v2';
    app.document.visibilityState = 'visible';
    assert.ok(app.fire('visibilitychange') >= 1, 'resume check registered');
    await nextTick();

    const bar = app.document.body.children[0];
    assert.ok(bar, 'bar appended on resume');
    assert.equal(bar.id, 'updateBar', 'update bar shown');
    assert.ok(String(bar.textContent).includes('New version ready'), 'bar says what it does');
  });
});
