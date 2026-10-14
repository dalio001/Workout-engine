// tests/p2_catalogue.test.mjs — P2-06 personal catalogue on the REAL app code.
// 1. Normalisation fills defaults, keeps ex1..ex15 stable, caps secondaries,
//    and is idempotent (no schema bump). 2. Built-in merge skips names the
//    owner already has. 3. Muscle/equipment/search filters. 4. Recent 10 from
//    finished workouts. 5. Multi-add order (workout + builder); replace stays
//    single. 6. Used custom -> hidden with usage message; unused -> deleted;
//    unhide works. 7. Custom names escaped in tab, picker and detail.
// 8. Restore accepts backups with and without the new fields.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, STATE_KEY } from './harness.mjs';

function plain(v) {
  return JSON.parse(JSON.stringify(v));
}

function finishDone(app) {
  app.api.finishWorkout();
  if (app.api.finishReviewPending) app.api.finishReviewDrop();
}

function finishOne(app, exId) {
  app.api.startEmptyWorkout();
  app.api.addExerciseToWorkout(exId);
  app.api.updateSetVal(0, 0, 'weight', '80');
  app.api.updateSetVal(0, 0, 'reps', '5');
  app.api.toggleSetDone(0, 0);
  finishDone(app);
}

function makeCustom(app, name) {
  app.api.openCustomExModal();
  app.el('newExName').value = name;
  app.el('newExEquipment').value = 'Dumbbell';
  app.el('newExMuscle').value = 'Chest';
  app.el('newExSecondary1').value = '';
  app.el('newExSecondary2').value = '';
  app.el('newExType').value = 'weight_reps';
  assert.equal(app.api.saveCustomExercise(), true, 'custom saved: ' + name);
  return app.api.state.exercises[0].id;
}

describe('P2-06 normalisation (no schema bump)', () => {
  it('normalise-fills-defaults-keeps-ex1-stable-idempotent', () => {
    const store = new Map();
    store.set(STATE_KEY, JSON.stringify({
      schemaVersion: 2, unit: 'KG', defaultRest: 90,
      exercises: [
        { id: 'ex1', name: 'Bench Press (Barbell)', muscle: 'Chest' },
        { id: 'ex_111', name: 'Tricep Thing', muscle: 'Arms' },
        { id: 'ex_222', name: 'Leg Day Fav', muscle: 'Legs' },
        { id: 'ex_333', name: 'Curl Bro', muscle: 'Biceps', equipment: 'Dumbbell', primary: 'Biceps', secondary: ['Forearms', 'Chest', 'Back'], type: 'weight_reps' },
      ],
      routines: [], history: [],
    }));
    const app = createApp({ store });
    assert.equal(app.api.DEFAULT_EXERCISES.length, 100, 'catalogue holds ~100 built-ins');
    const byId = {};
    app.api.state.exercises.forEach((e) => { byId[e.id] = e; });
    assert.equal(byId.ex1.equipment, 'Barbell', 'ex1 equipment filled from built-in');
    assert.equal(byId.ex1.primary, 'Chest', 'ex1 primary filled from built-in');
    assert.deepEqual(plain(byId.ex1.secondary), ['Shoulders', 'Triceps'], 'ex1 secondaries from built-in');
    assert.equal(byId.ex1.name, 'Bench Press (Barbell)', 'ex1 name untouched');
    assert.equal(byId.ex_111.primary, 'Triceps', 'custom Arms -> Triceps when the name says tricep');
    assert.equal(byId.ex_222.primary, 'Quads', 'custom Legs -> Quads');
    assert.equal(byId.ex_222.equipment, 'Other', 'custom equipment defaults to Other');
    assert.deepEqual(plain(byId.ex_333.secondary), ['Forearms', 'Chest'], 'custom secondaries capped at 2');
    assert.equal(app.api.state.exercises.length, 103, '4 kept + 99 merged built-ins');
    assert.deepEqual(plain(app.api.state.routines), [], 'routines untouched');
    assert.deepEqual(plain(app.api.state.history), [], 'history untouched');
    const snap = JSON.stringify(app.api.state.exercises);
    app.api.normalizeExercises(app.api.state);
    assert.equal(JSON.stringify(app.api.state.exercises), snap, 'second run changes nothing');
  });

  it('merge-skips-names-owner-already-has', () => {
    const store = new Map();
    store.set(STATE_KEY, JSON.stringify({
      schemaVersion: 2, unit: 'KG', defaultRest: 90,
      exercises: [
        { id: 'ex1', name: 'Bench Press (Barbell)', muscle: 'Chest' },
        { id: 'ex_999', name: 'Goblet Squat', muscle: 'Chest' },
      ],
      routines: [], history: [],
    }));
    const app = createApp({ store });
    const ids = app.api.state.exercises.map((e) => e.id);
    assert.ok(ids.indexOf('ex_999') >= 0, 'owner custom kept');
    assert.ok(ids.indexOf('ex70') < 0, 'built-in Goblet Squat skipped (name clash, owner wins)');
    assert.equal(ids.length, 100, '2 kept + 98 merged');
  });
});

describe('P2-06 filters and recent', () => {
  it('filter-by-muscle-equipment-search', () => {
    const app = createApp();
    const res = app.api.getFilteredExercises('', 'Chest', 'Dumbbell', false);
    assert.deepEqual(
      plain(res.map((e) => e.id)).sort(),
      ['ex16', 'ex19', 'ex2', 'ex22', 'ex97'].sort(),
      'chest dumbbells only',
    );
    res.forEach((e) => {
      assert.equal(e.equipment, 'Dumbbell');
      assert.ok(e.primary === 'Chest' || e.secondary.indexOf('Chest') >= 0, 'muscle chip matches primary or secondary');
    });
    const q = app.api.getFilteredExercises('squat', '', '', false);
    assert.ok(q.length > 0, 'search finds squats');
    q.forEach((e) => assert.ok(e.name.toLowerCase().includes('squat'), 'every hit matches: ' + e.name));
  });

  it('recent-returns-last-10-used-deduped', () => {
    const app = createApp();
    const ids = ['ex1', 'ex2', 'ex3', 'ex4', 'ex5', 'ex6', 'ex7', 'ex8', 'ex9', 'ex10', 'ex11', 'ex12'];
    ids.forEach((id) => finishOne(app, id));
    assert.equal(app.api.state.history.length, 12, '12 finished workouts');
    assert.deepEqual(
      plain(app.api.getRecentExerciseIds()),
      ['ex12', 'ex11', 'ex10', 'ex9', 'ex8', 'ex7', 'ex6', 'ex5', 'ex4', 'ex3'],
      'newest 10, deduped, oldest two dropped',
    );
  });
});

describe('P2-06 multi-add and replace', () => {
  it('multi-add-appends-N-in-order-to-workout', () => {
    const app = createApp();
    app.api.startEmptyWorkout();
    app.api.openExercisePicker('workout');
    app.api.togglePickerSelect('ex1');
    app.api.togglePickerSelect('ex7');
    app.api.togglePickerSelect('ex13');
    assert.equal(app.api.addPickerSelected(), 3, 'three added');
    assert.deepEqual(
      plain(app.api.activeWorkout.exercises.map((e) => e.exId)),
      ['ex1', 'ex7', 'ex13'],
      'listed order kept',
    );
  });

  it('multi-add-appends-N-in-order-to-routine-builder', () => {
    const app = createApp();
    app.api.openRoutineBuilder();
    app.api.openExercisePicker('routine');
    app.api.togglePickerSelect('ex4');
    app.api.togglePickerSelect('ex5');
    assert.equal(app.api.addPickerSelected(), 2, 'two added');
    assert.deepEqual(
      plain(app.api.tempRoutineExercises.map((e) => e.exId)),
      ['ex4', 'ex5'],
      'builder order kept',
    );
  });

  it('replace-stays-single', () => {
    const app = createApp();
    app.api.startEmptyWorkout();
    app.api.addExerciseToWorkout('ex1');
    app.api.openReplacePicker(0);
    app.api.selectExercise('ex2');
    assert.equal(app.api.activeWorkout.exercises.length, 1, 'still one exercise');
    assert.equal(app.api.activeWorkout.exercises[0].exId, 'ex2', 'replaced, not appended');
  });
});

describe('P2-06 custom edit, hide and unhide', () => {
  it('unused-custom-deletes', () => {
    const app = createApp();
    const id = makeCustom(app, 'Temp Move');
    assert.equal(app.api.deleteExercise(id), true, 'deleted');
    assert.ok(!app.api.state.exercises.some((e) => e.id === id), 'gone from list');
  });

  it('used-custom-hides-with-usage-message-then-unhides', () => {
    const app = createApp();
    const id = makeCustom(app, 'Keeper Move');
    const s = app.api.state;
    s.history = [{
      id: 'w1', title: 'W', date: 1728000000000, durationSec: 60,
      totalVolume: 50, totalSets: 1,
      exercises: [{ exId: id, sets: [{ weight: 10, reps: 5 }] }],
    }];
    s.routines = [{ id: 'rt9', name: 'Push', exercises: [{ exId: id, sets: 3 }] }];
    assert.equal(app.api.deleteExercise(id), 'hidden', 'blocked -> hidden');
    assert.equal(app.api.state.exercises.find((e) => e.id === id).hidden, true, 'flag set');
    assert.match(app.alerts[app.alerts.length - 1], /1 workout/, 'message names workout usage');
    assert.match(app.alerts[app.alerts.length - 1], /Push/, 'message names the routine');
    assert.ok(!app.api.getFilteredExercises('', '', '', false).some((e) => e.id === id), 'hidden from lists and picker');
    assert.ok(app.api.getFilteredExercises('', '', '', true).some((e) => e.id === id), 'visible with Show hidden');
    assert.equal(app.api.unhideExercise(id), true, 'unhidden');
    assert.equal(app.api.state.exercises.find((e) => e.id === id).hidden, false, 'flag cleared');
  });

  it('custom-edit-updates-fields-secondary-max-2', () => {
    const app = createApp();
    const id = makeCustom(app, 'Editable Move');
    app.api.openCustomExModal(id);
    app.el('newExName').value = 'Edited Move';
    app.el('newExEquipment').value = 'Cable';
    app.el('newExMuscle').value = 'Back';
    app.el('newExSecondary1').value = 'Biceps';
    app.el('newExSecondary2').value = 'Biceps';
    app.el('newExType').value = 'weight_reps';
    assert.equal(app.api.saveCustomExercise(), true, 'edit saved');
    const ex = app.api.state.exercises.find((e) => e.id === id);
    assert.equal(ex.name, 'Edited Move', 'renamed');
    assert.equal(ex.equipment, 'Cable', 'equipment updated');
    assert.deepEqual(plain(ex.secondary), ['Biceps'], 'secondary deduped, max 2');
  });
});

describe('P2-06 escaping', () => {
  it('custom-names-render-escaped-in-tab-picker-detail', () => {
    const app = createApp();
    const evil = '<img src=x onerror=alert(1)>';
    const id = makeCustom(app, evil);
    app.api.renderExercisesTab();
    const tab = app.el('exercisesDirectory').innerHTML;
    assert.ok(!tab.includes('<img src=x'), 'tab has no raw injection');
    assert.ok(tab.includes('&lt;img'), 'tab shows escaped name');
    app.api.openExercisePicker('workout');
    const picker = app.el('pickerList').innerHTML;
    assert.ok(!picker.includes('<img src=x'), 'picker has no raw injection');
    assert.ok(picker.includes('&lt;img'), 'picker shows escaped name');
    app.api.openExerciseDetail(id);
    const detail = app.el('exDetailBody').innerHTML;
    assert.ok(!detail.includes('<img src=x'), 'detail has no raw injection');
    assert.ok(detail.includes('&lt;img'), 'detail shows escaped name');
    assert.ok(detail.includes('Weight × reps'), 'type shown as a small label');
  });
});

describe('P2-06 restore compatibility', () => {
  it('restore-accepts-old-backup-without-new-fields', () => {
    const app = createApp();
    const r = app.api.validateBackupData({
      schemaVersion: 2, unit: 'KG', defaultRest: 90,
      exercises: [{ id: 'ex1', name: 'Bench Press (Barbell)', muscle: 'Chest' }],
      routines: [], history: [],
    });
    assert.equal(r.ok, true, 'old backup accepted');
    const ex1 = r.data.exercises.find((e) => e.id === 'ex1');
    assert.equal(ex1.equipment, 'Barbell', 'built-in fields filled');
    assert.equal(ex1.primary, 'Chest', 'primary filled');
    assert.equal(r.data.exercises.length, 1, 'preview counts describe the backup file');
    app.api.pendingRestore = r.data;
    app.api.confirmRestore();
    assert.equal(app.api.state.exercises.length, 100, 'built-ins merged on restore');
  });

  it('restore-accepts-new-backup-with-new-fields', () => {
    const app = createApp();
    const r = app.api.validateBackupData({
      schemaVersion: 2, unit: 'KG', defaultRest: 90,
      exercises: [{
        id: 'ex_1', name: 'My Move', equipment: 'Kettlebell', muscle: 'Glutes',
        primary: 'Glutes', secondary: ['Hamstrings'], type: 'duration',
        custom: true, fav: true, hidden: false,
      }],
      routines: [], history: [],
    });
    assert.equal(r.ok, true, 'new backup accepted');
    const mine = r.data.exercises.find((e) => e.id === 'ex_1');
    assert.equal(mine.equipment, 'Kettlebell', 'equipment preserved');
    assert.equal(mine.type, 'duration', 'type preserved');
    assert.equal(mine.fav, true, 'favourite preserved');
  });
});
