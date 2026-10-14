// tests/p2_routine_editor.test.mjs — P2-04 personal part on the REAL app code.
// Edit/duplicate/reorder/delete-with-undo, targets+note+rest roundtrip,
// legacy defaults, workout prefill, optional update-from-workout.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, loadIndexHtml } from './harness.mjs';

function editRt1WithTargets(app) {
  app.api.editRoutine('rt1');
  app.api.updateBuilderSets(0, '4');
  app.api.updateBuilderReps(0, '8-12');
  app.api.updateBuilderWeight(0, '60');
  app.api.updateBuilderNote(0, 'Keep elbows tucked');
  app.api.openBuilderRestPicker(0);
  app.api.pickRestOption(120);
  app.el('routineNameInput').value = 'Push Edited';
  app.api.saveRoutine();
  return app;
}

function finishOneTickedSet(app) {
  app.api.startRoutineWorkout('rt1');
  app.api.updateSetVal(0, 0, 'weight', '100');
  app.api.updateSetVal(0, 0, 'reps', '5');
  app.api.toggleSetDone(0, 0);
  app.api.finishWorkout();
  assert.equal(app.api.finishReviewPending, true, 'review opens (many unticked)');
  app.api.finishReviewDrop();
  assert.equal(app.api.state.history.length, 1, 'one history entry saved');
  return app;
}

describe('P2-04 routine editor', () => {
  it('edit-rename-keeps-id-and-history', () => {
    const app = createApp();
    const beforeIds = app.api.state.routines.map((r) => r.id);
    app.api.editRoutine('rt1');
    assert.equal(app.api.editingRoutineId, 'rt1', 'edit mode set');
    app.el('routineNameInput').value = 'Push Renamed';
    app.api.saveRoutine();
    assert.equal(JSON.stringify(app.api.state.routines.map((r) => r.id)), JSON.stringify(beforeIds), 'ids and order kept');
    assert.equal(app.api.state.routines[0].name, 'Push Renamed', 'renamed');
    assert.equal(app.api.state.history.length, 0, 'history untouched');
  });

  it('edit-targets-note-rest-roundtrip', () => {
    const app = editRt1WithTargets(createApp());
    const item = app.api.state.routines[0].exercises[0];
    assert.equal(item.sets, 4, 'sets saved');
    assert.equal(item.targetRepsMin, 8, 'reps min saved');
    assert.equal(item.targetRepsMax, 12, 'reps max saved');
    assert.equal(item.targetWeightKg, 60, 'target weight saved (kg)');
    assert.equal(item.note, 'Keep elbows tucked', 'note saved');
    assert.equal(item.restSec, 120, 'rest saved via P2-03 picker');
  });

  it('reorder-exercises-up-down', () => {
    const app = createApp();
    app.api.editRoutine('rt1');
    const first = app.api.tempRoutineExercises[0].exId;
    const second = app.api.tempRoutineExercises[1].exId;
    app.api.moveBuilderExercise(0, 1);
    assert.equal(app.api.tempRoutineExercises[0].exId, second, 'moved down');
    assert.equal(app.api.tempRoutineExercises[1].exId, first, 'moved up pair');
    app.api.moveBuilderExercise(1, -1);
    assert.equal(app.api.tempRoutineExercises[0].exId, first, 'moved back up');
    app.api.moveBuilderExercise(0, -1);
    assert.equal(app.api.tempRoutineExercises[0].exId, first, 'top stays (no-op)');
  });

  it('reorder-routines-persists', () => {
    const store = new Map();
    const app = createApp({ store });
    app.api.moveRoutine('rt1', 1);
    assert.equal(JSON.stringify(app.api.state.routines.map((r) => r.id)), JSON.stringify(['rt2', 'rt1', 'rt3']), 'moved down');
    const app2 = createApp({ store });
    assert.equal(JSON.stringify(app2.api.state.routines.map((r) => r.id)), JSON.stringify(['rt2', 'rt1', 'rt3']), 'order survives reload');
  });

  it('duplicate-names-copy-and-clones-targets', () => {
    const app = editRt1WithTargets(createApp());
    const srcItem = app.api.state.routines[0].exercises[0];
    app.api.duplicateRoutine('rt1');
    assert.equal(app.api.state.routines.length, 4, 'one added after source');
    const copy = app.api.state.routines[1];
    assert.equal(copy.name, 'Push Edited (copy)', 'copy suffix');
    assert.notEqual(copy.id, 'rt1', 'new id');
    assert.deepEqual(copy.exercises[0].targetRepsMin, srcItem.targetRepsMin, 'targets cloned');
    assert.deepEqual(copy.exercises[0].targetRepsMax, srcItem.targetRepsMax, 'targets cloned');
    assert.deepEqual(copy.exercises[0].targetWeightKg, srcItem.targetWeightKg, 'targets cloned');
    assert.deepEqual(copy.exercises[0].restSec, srcItem.restSec, 'rest cloned');
    assert.deepEqual(copy.exercises[0].note, srcItem.note, 'note cloned');
    app.api.duplicateRoutine('rt1');
    assert.equal(app.api.state.routines[1].name, 'Push Edited (copy 2)', 'clash increments');
  });

  it('delete-undo-within-10s-restores-index', () => {
    const app = createApp();
    const before = app.api.state.routines.map((r) => r.id);
    app.api.deleteRoutine('rt2');
    assert.equal(app.confirms.length, 1, 'confirm asked');
    assert.equal(JSON.stringify(app.api.state.routines.map((r) => r.id)), JSON.stringify(['rt1', 'rt3']), 'removed');
    assert.ok(app.api.deletedRoutineBackup, 'undo snapshot kept');
    app.api.undoDeleteRoutine();
    assert.equal(JSON.stringify(app.api.state.routines.map((r) => r.id)), JSON.stringify(before), 'restored at same index');
    assert.equal(app.api.deletedRoutineBackup, null, 'snapshot cleared');
  });

  it('delete-expiry-purges', () => {
    const app = createApp();
    app.api.deleteRoutine('rt2');
    const exp = app.api.deletedRoutineBackup.expiresAt;
    app.api.expireDeletedRoutine(exp - 1);
    assert.ok(app.api.deletedRoutineBackup, 'not yet expired');
    app.api.expireDeletedRoutine(exp + 1);
    assert.equal(app.api.deletedRoutineBackup, null, 'purged after 10s');
    app.api.undoDeleteRoutine();
    assert.equal(JSON.stringify(app.api.state.routines.map((r) => r.id)), JSON.stringify(['rt1', 'rt3']), 'late undo is a no-op');
  });

  it('legacy-routine-defaults-apply', () => {
    const app = createApp();
    const norm = app.api.normalizeRoutineItem({ exId: 'ex1', sets: 3 });
    assert.equal(norm.sets, 3, 'sets kept');
    assert.equal(norm.targetRepsMin, null, 'reps min defaults null');
    assert.equal(norm.targetRepsMax, null, 'reps max defaults null');
    assert.equal(norm.targetWeightKg, null, 'weight defaults null');
    assert.equal(norm.restSec, 90, 'rest falls back to Profile default');
    assert.equal(norm.note, '', 'note defaults empty');
    assert.equal(app.api.state.routines[0].exercises[0].restSec, undefined, 'stored seed untouched');
    app.api.startRoutineWorkout('rt1');
    const ex = app.api.activeWorkout.exercises[0];
    assert.equal(ex.sets[0].weight, '', 'no target, no history -> empty');
    assert.equal(ex.sets[0].reps, '', 'reps empty');
    assert.equal(ex.targetRepsLabel, '', 'no placeholder target');
    assert.equal(ex.note, '', 'no note');
  });

  it('start-prefills-targets-and-note', () => {
    const app = editRt1WithTargets(createApp());
    app.api.startRoutineWorkout('rt1');
    const ex = app.api.activeWorkout.exercises[0];
    assert.equal(ex.sets.length, 4, 'N sets from prescription');
    assert.equal(ex.sets[0].weight, 60, 'target weight prefilled (kg)');
    assert.equal(ex.sets[0].reps, '', 'reps left empty');
    assert.equal(ex.targetRepsLabel, '8-12', 'range label carried');
    assert.equal(ex.note, 'Keep elbows tucked', 'note carried');
    assert.equal(app.api.getExerciseRestSec(0), 120, 'rest from routine');
  });

  it('update-from-workout-no-means-unchanged', () => {
    const app = finishOneTickedSet(createApp());
    const before = JSON.stringify(app.api.state.routines);
    assert.ok(app.api.pendingRoutineUpdate, 'offer pending after finish');
    assert.match(app.el('routineUpdateText').textContent, /Past workouts stay unchanged/, 'offer text');
    app.api.declineRoutineUpdate();
    assert.equal(JSON.stringify(app.api.state.routines), before, 'routine unchanged on No');
    assert.equal(app.api.pendingRoutineUpdate, null, 'offer cleared');
    assert.equal(app.api.state.history.length, 1, 'history kept');
  });

  it('update-from-workout-yes-writes-back', () => {
    const app = finishOneTickedSet(createApp());
    const historyBefore = JSON.stringify(app.api.state.history);
    app.api.confirmRoutineUpdate();
    const rt = app.api.state.routines.find((r) => r.id === 'rt1');
    assert.equal(rt.exercises.length, 1, 'routine matches performed work');
    assert.deepEqual(
      [rt.exercises[0].sets, rt.exercises[0].targetRepsMin, rt.exercises[0].targetRepsMax, rt.exercises[0].targetWeightKg],
      [1, 5, 5, 100],
      'sets count + targets from performed sets',
    );
    assert.equal(JSON.stringify(app.api.state.history), historyBefore, 'past history never rewritten');
  });

  it('editor-modal-and-offer-modal-exist', () => {
    const html = loadIndexHtml();
    for (const s of ['id="routineModalTitle"', 'editRoutine(', 'duplicateRoutine(', 'undoDeleteRoutine()',
      'moveBuilderExercise(', 'openBuilderRestPicker(', 'id="routineUpdateModal"', 'confirmRoutineUpdate()']) {
      assert.ok(html.includes(s), `index.html contains ${s}`);
    }
  });
});
