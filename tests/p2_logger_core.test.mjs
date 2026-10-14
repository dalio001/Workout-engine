// tests/p2_logger_core.test.mjs — P2-01/02/03 personal parts on the REAL app code.
// 1. Set validation: bad weight/reps rejected, not saved, not tickable; 0 kg ok.
// 2. Volume never negative (legacy -5 kg rows excluded/clamped).
// 3. Finish review: unticked sets -> modal; tick-all keeps, drop removes, back keeps open; zero-done keeps message.
// 4. Per-exercise rest: right duration, Off starts none, survives reload, old routines use default, routines remember.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, DRAFT_KEY, loadIndexHtml } from './harness.mjs';

function startWithOneDone(app) {
  app.api.startRoutineWorkout('rt1');
  app.api.updateSetVal(0, 0, 'weight', '100');
  app.api.updateSetVal(0, 0, 'reps', '5');
  app.api.toggleSetDone(0, 0);
  // Two more valid-but-unticked sets on the same exercise.
  app.api.updateSetVal(0, 1, 'weight', '100');
  app.api.updateSetVal(0, 1, 'reps', '5');
  app.api.updateSetVal(0, 2, 'weight', '80');
  app.api.updateSetVal(0, 2, 'reps', '8');
  return app;
}

describe('P2-02 set validation', () => {
  it('negative weight is rejected, not saved, not tickable', () => {
    const app = createApp();
    app.api.startRoutineWorkout('rt1');
    app.api.updateSetVal(0, 0, 'weight', '-5');
    app.api.updateSetVal(0, 0, 'reps', '10');
    assert.notEqual(app.api.activeWorkout.exercises[0].sets[0].weight, -5, 'invalid weight never saved');
    const ok = app.api.toggleSetDone(0, 0);
    assert.equal(ok, false, 'toggle refused');
    assert.equal(app.api.activeWorkout.exercises[0].sets[0].done, false, 'set stays unticked');
    assert.ok(app.api.setInputErrors['0:0']?.weight, 'error recorded for red outline/message');
  });

  it('absurd reps (5000), zero, fractional reps rejected; 0 kg bodyweight accepted', () => {
    const app = createApp();
    app.api.startRoutineWorkout('rt1');
    app.api.updateSetVal(0, 0, 'weight', '60');
    app.api.updateSetVal(0, 0, 'reps', '5000');
    assert.notEqual(app.api.activeWorkout.exercises[0].sets[0].reps, 5000, 'reps 5000 never saved');
    assert.equal(app.api.toggleSetDone(0, 0), false, '5000-rep set not tickable');

    app.api.updateSetVal(0, 1, 'weight', '60');
    app.api.updateSetVal(0, 1, 'reps', '0');
    assert.equal(app.api.toggleSetDone(0, 1), false, '0 reps not tickable');

    app.api.updateSetVal(0, 2, 'weight', '60');
    app.api.updateSetVal(0, 2, 'reps', '2.5');
    assert.equal(app.api.toggleSetDone(0, 2), false, 'fractional reps not tickable');

    // Bodyweight: 0 kg x 10 is valid and tickable.
    const app2 = createApp();
    app2.api.startRoutineWorkout('rt1');
    app2.api.updateSetVal(0, 0, 'weight', '0');
    app2.api.updateSetVal(0, 0, 'reps', '10');
    assert.equal(app2.api.toggleSetDone(0, 0), true, '0 kg bodyweight set ticks');
    assert.equal(app2.api.activeWorkout.exercises[0].sets[0].done, true);
  });

  it('weight above 1000 kg rejected', () => {
    const app = createApp();
    app.api.startRoutineWorkout('rt1');
    app.api.updateSetVal(0, 0, 'weight', '1500');
    app.api.updateSetVal(0, 0, 'reps', '5');
    assert.notEqual(app.api.activeWorkout.exercises[0].sets[0].weight, 1500);
    assert.equal(app.api.toggleSetDone(0, 0), false);
  });

  it('volume never negative even with a legacy -5 kg ticked row', () => {
    const app = createApp();
    app.api.startRoutineWorkout('rt1');
    // Valid done set.
    app.api.updateSetVal(0, 0, 'weight', '100');
    app.api.updateSetVal(0, 0, 'reps', '5');
    app.api.toggleSetDone(0, 0);
    // Simulate a legacy corrupt row forced ticked outside validation.
    const bad = app.api.activeWorkout.exercises[0].sets[1];
    bad.weight = -5;
    bad.reps = 10;
    bad.done = true;
    app.api.finishWorkout(); // unticked rows remain -> review opens
    assert.equal(app.api.finishReviewPending, true, 'review opens');
    app.api.finishReviewDrop(); // save only done rows
    assert.equal(app.api.state.history.length, 1, 'one history entry');
    const w = app.api.state.history[0];
    assert.ok(w.totalVolume >= 0, `volume never negative, got ${w.totalVolume}`);
    assert.equal(w.totalVolume, 500, 'only the valid 100x5 counts');
    assert.equal(w.totalSets, 1, 'legacy invalid set excluded');
  });
});

describe('P2-01 finish review', () => {
  it('unticked sets open the review; tick-all keeps them', () => {
    const app = startWithOneDone(createApp());
    app.api.finishWorkout();
    assert.equal(app.api.finishReviewPending, true, 'review pending');
    assert.equal(app.api.state.history.length, 0, 'nothing saved yet');
    assert.match(app.el('finishReviewText').textContent, /not ticked/, 'modal text names unticked sets');
    app.api.finishReviewTickAll();
    assert.equal(app.api.state.history.length, 1, 'saved after tick-all');
    assert.equal(app.api.state.history[0].totalSets, 3, 'all three valid sets kept');
    assert.equal(app.api.activeWorkout, null, 'workout closed after save');
  });

  it('drop removes unticked sets, back keeps the workout open', () => {
    const app = startWithOneDone(createApp());
    app.api.finishWorkout();
    app.api.finishReviewDrop();
    assert.equal(app.api.state.history.length, 1);
    assert.equal(app.api.state.history[0].totalSets, 1, 'only the ticked set saved');

    const app2 = startWithOneDone(createApp());
    app2.api.finishWorkout();
    assert.equal(app2.api.finishReviewPending, true);
    app2.api.finishReviewBack();
    assert.equal(app2.api.finishReviewPending, false, 'review closed');
    assert.equal(app2.api.state.history.length, 0, 'nothing saved');
    assert.ok(app2.api.activeWorkout, 'workout still open');
  });

  it('zero done sets keeps the existing message and saves nothing', () => {
    const app = createApp();
    app.api.startRoutineWorkout('rt1');
    app.api.finishWorkout();
    assert.equal(app.alerts.length, 1, 'one alert');
    assert.match(app.alerts[0], /Complete at least one set/, 'existing message kept');
    assert.equal(app.api.state.history.length, 0, 'nothing saved');
    assert.ok(app.api.activeWorkout, 'workout still open');
  });

  it('finish stays idempotent through the review (one history entry)', () => {
    const app = startWithOneDone(createApp());
    app.api.finishWorkout();
    app.api.finishReviewTickAll();
    app.api.finishWorkout(); // no live workout -> no-op
    assert.equal(app.api.state.history.length, 1, 'exactly one entry');
  });
});

describe('P2-03 per-exercise rest', () => {
  it('ticking starts THAT exercise duration; Off starts no timer', () => {
    const app = createApp();
    app.api.startRoutineWorkout('rt1');
    app.api.setExerciseRest(0, 150); // 2:30 on first exercise
    app.api.updateSetVal(0, 0, 'weight', '60');
    app.api.updateSetVal(0, 0, 'reps', '8');
    const before = Date.now();
    app.api.toggleSetDone(0, 0);
    const remain = Math.round((app.api.restDeadline - before) / 1000);
    assert.ok(app.api.restDeadline > before, 'deadline in the future');
    assert.ok(remain >= 145 && remain <= 150, `~150s rest, got ${remain}`);

    const app2 = createApp();
    app2.api.startRoutineWorkout('rt1');
    app2.api.setExerciseRest(1, 0); // Off on second exercise
    app2.api.updateSetVal(1, 0, 'weight', '60');
    app2.api.updateSetVal(1, 0, 'reps', '8');
    app2.api.toggleSetDone(1, 0);
    assert.equal(app2.api.restDeadline, null, 'Off starts no timer');
    assert.equal(app2.api.getExerciseRestSec(1), 0, 'Off remembered');
  });

  it('per-exercise rest survives reload via restDeadline', () => {
    const store = new Map();
    const app = createApp({ store });
    app.api.startRoutineWorkout('rt1');
    app.api.setExerciseRest(0, 150);
    app.api.updateSetVal(0, 0, 'weight', '60');
    app.api.updateSetVal(0, 0, 'reps', '8');
    app.api.toggleSetDone(0, 0);
    assert.ok(store.has(DRAFT_KEY), 'draft saved');

    const app2 = createApp({ store });
    const draft = app2.api.loadActiveSessionDraft();
    assert.ok(draft, 'draft loads');
    assert.equal(typeof draft.restDeadline, 'number', 'deadline persisted');
    assert.ok(draft.restDeadline > Date.now(), 'deadline still future');
    app2.api.resumeSavedWorkout();
    assert.equal(app2.api.getExerciseRestSec(0), 150, 'per-exercise rest restored');
    assert.ok(app2.api.restDeadline > Date.now(), 'timer running after resume');
  });

  it('old routine without restSec uses the Profile default; routines remember rest', () => {
    const app = createApp();
    assert.equal(app.api.state.routines[0].exercises[0].restSec, undefined, 'seed has no restSec');
    app.api.startRoutineWorkout('rt1');
    assert.equal(app.api.getExerciseRestSec(0), app.api.state.defaultRest || 90, 'default used');
    app.api.setExerciseRest(0, 150);
    const rt = app.api.state.routines.find((r) => r.id === 'rt1');
    assert.equal(rt.exercises[0].restSec, 150, 'routine remembers rest');
  });

  it('rest picker offers Off plus the required choices; chips and review modal exist', () => {
    const html = loadIndexHtml();
    for (const s of ['id="finishReviewModal"', 'Tick them as done', 'id="restPickerModal"', 'openRestPicker(', 'REST_OPTIONS']) {
      assert.ok(html.includes(s), `index.html contains ${s}`);
    }
    assert.deepEqual([...app_restOptions()].slice(0, 3), [0, 30, 45]);
    function app_restOptions() { return [0, 30, 45, 60, 90, 120, 150, 180, 240, 300]; }
    const app = createApp();
    assert.deepEqual(JSON.stringify(app.api.REST_OPTIONS), JSON.stringify([0, 30, 45, 60, 90, 120, 150, 180, 240, 300]));
    assert.equal(app.api.formatRestLabel(0), 'Rest Off');
    assert.equal(app.api.formatRestLabel(90), 'Rest 1:30');
  });
});
