// tests/p2_drop_superset.test.mjs — P2-12 Part 2: One-tap Drop Sets & Supersets
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, DRAFT_KEY, loadIndexHtml } from './harness.mjs';

function startEmpty(app) {
  app.api.startEmptyWorkout();
  return app;
}

function addExercise(app, exId) {
  app.api.addExerciseToWorkout(exId);
  return app;
}

function sentinelBox(app) {
  app.api.renderActiveWorkout();
  const box = app.el('activeExercisesContainer');
  box.innerHTML = 'SENTINEL';
  return box;
}

describe('P2-12 Part 2 — Drop sets ("Drop it")', () => {
  it('drop-chip-shows-only-after-ticking-a-weight-set', () => {
    const app = startEmpty(createApp());
    // ex1: Bench Press (weight_reps), ex17: Push-Up (bodyweight_reps), ex60: Plank (duration)
    addExercise(app, 'ex1');
    addExercise(app, 'ex17');
    addExercise(app, 'ex60');

    // Unticked Bench Press: no drop chip
    app.api.updateSetVal(0, 0, 'weight', '100');
    app.api.updateSetVal(0, 0, 'reps', '10');
    app.api.renderActiveWorkout();
    assert.ok(!app.el('activeExercisesContainer').innerHTML.includes('⬇ Drop'), 'unticked set has no drop chip');

    // Warm-up set ticked on Bench Press: no drop chip
    app.api.setSetType(0, 0, 'W');
    app.api.toggleSetDone(0, 0);
    assert.ok(!app.el('activeExercisesContainer').innerHTML.includes('⬇ Drop'), 'warm-up set has no drop chip');

    // Normal set ticked on Bench Press: drop chip appears!
    app.api.toggleSetDone(0, 0); // untick
    app.api.setSetType(0, 0, 'N');
    app.api.toggleSetDone(0, 0); // tick
    assert.ok(app.el('activeExercisesContainer').innerHTML.includes('⬇ Drop'), 'ticked normal weight set shows drop chip');

    // Bodyweight exercise (Push-Up): ticked has no drop chip
    app.api.updateSetVal(1, 0, 'reps', '15');
    app.api.toggleSetDone(1, 0);
    // Duration exercise (Plank): ticked has no drop chip
    app.api.updateSetDuration(2, 0, '1:00');
    app.api.toggleSetDone(2, 0);
    const html = app.el('activeExercisesContainer').innerHTML;
    // Exactly one drop chip in container (for Bench Press)
    const chipCount = (html.match(/⬇ Drop/g) || []).length;
    assert.equal(chipCount, 1, 'only the weight exercise set has a drop chip');
  });

  it('drop-inserts-below-with-20pct-rounded-down-kg', () => {
    const app = startEmpty(createApp());
    addExercise(app, 'ex1'); // Bench Press
    app.api.addSetToActive(0); // 2 sets total
    app.api.updateSetVal(0, 0, 'weight', '100');
    app.api.updateSetVal(0, 0, 'reps', '10');
    app.api.updateSetVal(0, 1, 'weight', '100');
    app.api.updateSetVal(0, 1, 'reps', '10');
    app.api.toggleSetDone(0, 0);

    const ok = app.api.addDropSet(0, 0);
    assert.equal(ok, true, 'drop set added');
    const sets = app.api.activeWorkout.exercises[0].sets;
    assert.equal(sets.length, 3, 'sets expanded from 2 to 3');
    // Drop set inserted at index 1
    const drop = sets[1];
    assert.equal(drop.type, 'D', 'type is D');
    assert.equal(drop.weight, 80, '100 kg - 20% = 80 kg');
    assert.equal(drop.reps, '', 'reps is empty');
    assert.equal(drop.done, false, 'drop starts unticked');
    // Original set 1 is now at index 2
    assert.equal(sets[2].type, 'N', 'original second set shifted to index 2');
    // Render check: reps placeholder is parent set reps (10)
    app.api.renderActiveWorkout();
    assert.equal(app.el('set-r-0-1').getAttribute('placeholder'), '10', 'reps placeholder is 10');
  });

  it('drop-in-lbs-rounds-to-5', () => {
    const app = startEmpty(createApp());
    app.api.state.unit = 'LBS';
    addExercise(app, 'ex1');
    app.api.updateSetVal(0, 0, 'weight', '135'); // 135 lb
    app.api.updateSetVal(0, 0, 'reps', '10');
    app.api.toggleSetDone(0, 0);

    app.api.addDropSet(0, 0);
    const drop = app.api.activeWorkout.exercises[0].sets[1];
    assert.equal(drop.type, 'D');
    // 135 * 0.8 = 108 lb -> rounded down to 5 lb step = 105 lb
    const dispLb = app.api.toDisplayWeight(drop.weight, 'LBS');
    assert.equal(dispLb, 105, '135 lb - 20% rounded down to 5 lb step is 105 lb');
  });

  it('drop-never-below-zero-shows-too-light', () => {
    const app = startEmpty(createApp());
    addExercise(app, 'ex1');
    // 2.5 kg: -20% is 2.0 kg -> rounded down to 2.5 kg step = 0 kg
    app.api.updateSetVal(0, 0, 'weight', '2.5');
    app.api.updateSetVal(0, 0, 'reps', '10');
    app.api.toggleSetDone(0, 0);

    app.api.renderActiveWorkout();
    assert.ok(app.el('activeExercisesContainer').innerHTML.includes('Too light to drop'), 'shows Too light to drop');
    // Calling addDropSet fails safely
    const ok = app.api.addDropSet(0, 0);
    assert.equal(ok, false, 'cannot add drop when weight is 0 or less');
    assert.equal(app.api.activeWorkout.exercises[0].sets.length, 1, 'no set was inserted');
  });

  it('drop-cancels-rest-timer', () => {
    const app = startEmpty(createApp());
    addExercise(app, 'ex1');
    app.api.setExerciseRest(0, 90);
    app.api.updateSetVal(0, 0, 'weight', '80');
    app.api.updateSetVal(0, 0, 'reps', '8');
    app.api.toggleSetDone(0, 0);

    assert.ok(app.api.restDeadline != null, 'rest timer started after tick');
    assert.equal(app.el('restTimerBar').classList.contains('active'), true, 'rest bar is active');

    // Tapping drop cancels the rest timer
    app.api.addDropSet(0, 0);
    assert.equal(app.api.restDeadline, null, 'rest timer cancelled by drop');
    assert.equal(app.el('restTimerBar').classList.contains('active'), false, 'rest bar deactivated');
  });

  it('chained-drops-lower-from-drop-weight', () => {
    const app = startEmpty(createApp());
    addExercise(app, 'ex1');
    app.api.updateSetVal(0, 0, 'weight', '100');
    app.api.updateSetVal(0, 0, 'reps', '10');
    app.api.toggleSetDone(0, 0);

    // Drop 1 from 100 kg -> 80 kg
    app.api.addDropSet(0, 0);
    assert.equal(app.api.activeWorkout.exercises[0].sets[1].weight, 80);

    // Tick Drop 1 with 8 reps
    app.api.updateSetVal(0, 1, 'reps', '8');
    app.api.toggleSetDone(0, 1);

    // Drop 2 from Drop 1 (80 kg): 80 * 0.8 = 64 kg -> rounded down to 2.5 step = 62.5 kg
    app.api.addDropSet(0, 1);
    const sets = app.api.activeWorkout.exercises[0].sets;
    assert.equal(sets.length, 3);
    assert.equal(sets[2].type, 'D');
    assert.equal(sets[2].weight, 62.5, 'chained drop lowers from previous drop weight (62.5 kg)');
  });

  it('drop-numbering-3-then-arrow1-arrow2-then-4', () => {
    const app = startEmpty(createApp());
    addExercise(app, 'ex1');
    // Add 3 more sets so we have 4 normal sets
    app.api.addSetToActive(0);
    app.api.addSetToActive(0);
    app.api.addSetToActive(0);
    for (let i = 0; i < 4; i++) {
      app.api.updateSetVal(0, i, 'weight', '100');
      app.api.updateSetVal(0, i, 'reps', '10');
    }

    // Tick Set 3 (index 2) and add 2 drops
    app.api.toggleSetDone(0, 2);
    app.api.addDropSet(0, 2); // Drop 1 at index 3
    app.api.updateSetVal(0, 3, 'reps', '8');
    app.api.toggleSetDone(0, 3);
    app.api.addDropSet(0, 3); // Drop 2 at index 4

    app.api.renderActiveWorkout();
    const container = app.el('activeExercisesContainer').innerHTML;
    // Set 1, 2, 3, ↳1, ↳2, 4
    assert.ok(container.includes('>1</button>'), 'Set 1 has label 1');
    assert.ok(container.includes('>2</button>'), 'Set 2 has label 2');
    assert.ok(container.includes('>3</button>'), 'Set 3 has label 3');
    assert.ok(container.includes('>↳1</button>'), 'Drop 1 has label ↳1');
    assert.ok(container.includes('>↳2</button>'), 'Drop 2 has label ↳2');
    assert.ok(container.includes('>4</button>'), 'Set 4 has label 4 (normal count not inflated)');
  });

  it('drop-step-choice-10-20-30-saved', () => {
    const app = startEmpty(createApp());
    assert.equal(app.api.state.dropStepPct, 20, 'default is 20');

    // Change to 10%
    app.api.setDropStepPct(10);
    assert.equal(app.api.state.dropStepPct, 10, 'saved 10%');
    addExercise(app, 'ex1');
    app.api.updateSetVal(0, 0, 'weight', '100');
    app.api.updateSetVal(0, 0, 'reps', '10');
    app.api.toggleSetDone(0, 0);
    app.api.addDropSet(0, 0);
    assert.equal(app.api.activeWorkout.exercises[0].sets[1].weight, 90, '100 kg - 10% = 90 kg');

    // Change to 30%
    app.api.setDropStepPct(30);
    assert.equal(app.api.state.dropStepPct, 30, 'saved 30%');
    const w30 = app.api.calcDropWeight(100, 30, 'KG');
    assert.equal(w30, 70, '100 kg - 30% = 70 kg');
  });

  it('removing-parent-removes-drops-and-undo-restores', () => {
    const app = startEmpty(createApp());
    addExercise(app, 'ex1');
    app.api.addSetToActive(0); // 2 sets
    app.api.updateSetVal(0, 0, 'weight', '100');
    app.api.updateSetVal(0, 0, 'reps', '10');
    app.api.updateSetVal(0, 1, 'weight', '100');
    app.api.updateSetVal(0, 1, 'reps', '10');

    // Tick Set 1 (index 0) and add 2 drops
    app.api.toggleSetDone(0, 0);
    app.api.addDropSet(0, 0); // Drop 1 at index 1
    app.api.updateSetVal(0, 1, 'reps', '8');
    app.api.toggleSetDone(0, 1);
    app.api.addDropSet(0, 1); // Drop 2 at index 2
    // Total sets = 4 (Set 1, Drop 1, Drop 2, Set 2)
    assert.equal(app.api.activeWorkout.exercises[0].sets.length, 4);

    // Remove parent Set 1 (index 0)
    app.api.removeActiveSet(0, 0);
    // Removing parent removes its 2 drops too! Only Set 2 remains
    assert.equal(app.api.activeWorkout.exercises[0].sets.length, 1, 'parent + 2 drops removed');

    // Undo restores all 3 sets in original place
    app.api.undoRemoveSet();
    const sets = app.api.activeWorkout.exercises[0].sets;
    assert.equal(sets.length, 4, 'all 4 sets restored');
    assert.equal(sets[0].type, 'N');
    assert.equal(sets[1].type, 'D');
    assert.equal(sets[2].type, 'D');
    assert.equal(sets[3].type, 'N');
  });

  it('routine-drops-after-last-premade-at-start', () => {
    const app = createApp();
    // Seed previous performance for Bench Press at 100 kg
    app.api.state.history.push({
      id: 'h_bench_prev',
      title: 'Previous Chest',
      date: Date.now() - 86400000,
      totalVolume: 3000,
      totalSets: 3,
      exercises: [{
        exId: 'ex1',
        sets: [
          { type: 'N', weight: 100, reps: 10, done: true },
          { type: 'N', weight: 100, reps: 10, done: true },
          { type: 'N', weight: 100, reps: 10, done: true }
        ]
      }]
    });

    // Routine with Bench Press, 3 sets, dropsAfterLast: 2
    app.api.state.routines.push({
      id: 'rt_drops',
      name: 'Chest with Drops',
      exercises: [
        app.api.normalizeRoutineItem({ exId: 'ex1', sets: 3, dropsAfterLast: 2 })
      ]
    });

    app.api.startRoutineWorkout('rt_drops');
    const sets = app.api.activeWorkout.exercises[0].sets;
    assert.equal(sets.length, 5, '3 normal sets + 2 pre-made drop rows');
    assert.equal(sets[0].type, 'N');
    assert.equal(sets[1].type, 'N');
    assert.equal(sets[2].type, 'N');
    assert.equal(sets[2].weight, 100);
    // Drop 1 lowered from 100 kg: 80 kg
    assert.equal(sets[3].type, 'D');
    assert.equal(sets[3].weight, 80);
    assert.equal(sets[3].done, false);
    // Drop 2 lowered from 80 kg: 62.5 kg
    assert.equal(sets[4].type, 'D');
    assert.equal(sets[4].weight, 62.5);
    assert.equal(sets[4].done, false);
  });
});

describe('P2-12 Part 2 — Supersets', () => {
  it('superset-with-groups-two-exercises-and-moves-them-adjacent', () => {
    const app = startEmpty(createApp());
    addExercise(app, 'ex1'); // 0: Bench Press
    addExercise(app, 'ex7'); // 1: Squat
    addExercise(app, 'ex3'); // 2: Incline Dumbbell Press

    // Superset Bench Press (0) with Incline DB Press (2)
    const ok = app.api.supersetWith(0, 2, 'workout');
    assert.equal(ok, true);

    const exs = app.api.activeWorkout.exercises;
    assert.ok(exs[0].supersetId != null, 'ex 0 has supersetId');
    assert.equal(exs[0].supersetId, exs[1].supersetId, 'ex 0 and ex 1 share same supersetId');
    assert.equal(exs[0].exId, 'ex1', 'first is Bench Press');
    assert.equal(exs[1].exId, 'ex3', 'second is Incline DB Press (moved adjacent!)');
    assert.equal(exs[2].exId, 'ex7', 'Squat shifted to index 2');
  });

  it('superset-labels-A1-A2-B1', () => {
    const app = startEmpty(createApp());
    addExercise(app, 'ex1');
    addExercise(app, 'ex3');
    addExercise(app, 'ex7');
    addExercise(app, 'ex8');

    app.api.activeWorkout.exercises[0].supersetId = 'ss_group1';
    app.api.activeWorkout.exercises[1].supersetId = 'ss_group1';
    app.api.activeWorkout.exercises[2].supersetId = 'ss_group2';
    app.api.activeWorkout.exercises[3].supersetId = 'ss_group2';

    const labels = app.api.computeSupersetLabels(app.api.activeWorkout.exercises);
    assert.equal(labels[0].label, 'A1');
    assert.equal(labels[1].label, 'A2');
    assert.equal(labels[2].label, 'B1');
    assert.equal(labels[3].label, 'B2');
    assert.notEqual(labels[0].color, labels[2].color, 'distinct group colors');

    app.api.renderActiveWorkout();
    const html = app.el('activeExercisesContainer').innerHTML;
    assert.ok(html.includes('>A1</span>'), 'A1 badge in DOM');
    assert.ok(html.includes('>A2</span>'), 'A2 badge in DOM');
    assert.ok(html.includes('>B1</span>'), 'B1 badge in DOM');
    assert.ok(html.includes('>B2</span>'), 'B2 badge in DOM');
    assert.ok(html.includes('Superset'), 'Superset pill in DOM');
  });

  it('smart-advance-scrolls-to-partner-and-rest-only-after-round', () => {
    const app = startEmpty(createApp());
    addExercise(app, 'ex1'); // A1
    addExercise(app, 'ex3'); // A2
    app.api.supersetWith(0, 1, 'workout');

    // Each has 2 sets
    app.api.addSetToActive(0);
    app.api.addSetToActive(1);
    app.api.updateSetVal(0, 0, 'weight', '80');
    app.api.updateSetVal(0, 0, 'reps', '10');
    app.api.updateSetVal(0, 1, 'weight', '80');
    app.api.updateSetVal(0, 1, 'reps', '10');
    app.api.updateSetVal(1, 0, 'weight', '30');
    app.api.updateSetVal(1, 0, 'reps', '10');
    app.api.updateSetVal(1, 1, 'weight', '30');
    app.api.updateSetVal(1, 1, 'reps', '10');

    assert.equal(app.api.state.supersetAdvance, true, 'smart advance default ON');

    // Tick Set 0 of A1
    app.api.toggleSetDone(0, 0);
    assert.equal(app.api.restDeadline, null, 'no rest timer after A1 set');
    assert.equal(app.api.lastScrolledTargetId, 'set-row-1-0', 'scrolled to set 0 of partner A2');

    // Tick Set 0 of A2 (last exercise in round)
    app.api.toggleSetDone(1, 0);
    assert.ok(app.api.restDeadline != null, 'rest timer started after final exercise of round');
    assert.equal(app.api.lastScrolledTargetId, 'set-row-0-1', 'scrolled back to set 1 of A1');
  });

  it('advance-off-starts-rest-as-before', () => {
    const app = startEmpty(createApp());
    addExercise(app, 'ex1');
    addExercise(app, 'ex3');
    app.api.supersetWith(0, 1, 'workout');
    app.api.updateSetVal(0, 0, 'weight', '80');
    app.api.updateSetVal(0, 0, 'reps', '10');

    app.api.setSupersetAdvance(false);
    assert.equal(app.api.state.supersetAdvance, false);

    // Tick Set 0 of A1 with advance off
    app.api.toggleSetDone(0, 0);
    assert.ok(app.api.restDeadline != null, 'rest timer started immediately when advance is off');
  });

  it('remove-from-superset', () => {
    const app = startEmpty(createApp());
    addExercise(app, 'ex1');
    addExercise(app, 'ex3');
    app.api.supersetWith(0, 1, 'workout');

    // Remove ex 0 from 2-exercise superset
    app.api.removeFromSuperset(0, 'workout');
    assert.equal(app.api.activeWorkout.exercises[0].supersetId, null);
    assert.equal(app.api.activeWorkout.exercises[1].supersetId, null, 'partner cleared too (no lone superset of 1)');

    // 3-exercise superset
    addExercise(app, 'ex7');
    app.api.activeWorkout.exercises[0].supersetId = 'ss_tri';
    app.api.activeWorkout.exercises[1].supersetId = 'ss_tri';
    app.api.activeWorkout.exercises[2].supersetId = 'ss_tri';
    app.api.removeFromSuperset(1, 'workout'); // remove middle
    assert.equal(app.api.activeWorkout.exercises[1].supersetId, null);
    assert.equal(app.api.activeWorkout.exercises[0].supersetId, 'ss_tri');
    assert.equal(app.api.activeWorkout.exercises[2].supersetId, 'ss_tri', 'remaining 2 keep superset');
  });

  it('history-keeps-supersetId-and-labels', () => {
    const app = startEmpty(createApp());
    addExercise(app, 'ex1');
    addExercise(app, 'ex3');
    app.api.supersetWith(0, 1, 'workout');
    app.api.updateSetVal(0, 0, 'weight', '80');
    app.api.updateSetVal(0, 0, 'reps', '10');
    app.api.toggleSetDone(0, 0);
    app.api.updateSetVal(1, 0, 'weight', '30');
    app.api.updateSetVal(1, 0, 'reps', '10');
    app.api.toggleSetDone(1, 0);

    // Finish workout
    app.api.finishWorkout();
    assert.equal(app.api.state.history.length, 1);
    const h = app.api.state.history[0];
    assert.ok(h.exercises[0].supersetId != null, 'history ex 0 has supersetId');
    assert.equal(h.exercises[0].supersetId, h.exercises[1].supersetId, 'history ex 0 and 1 share supersetId');

    // Open detail
    app.api.openHistDetail(h.id);
    const body = app.el('histDetailBody').innerHTML;
    assert.ok(body.includes('>A1</span>'), 'A1 badge in history detail');
    assert.ok(body.includes('>A2</span>'), 'A2 badge in history detail');
    assert.ok(body.includes('Superset'), 'Superset pill in history detail');
  });
});

describe('P2-12 Part 2 — Compatibility, Handlers & Focus Safety', () => {
  it('old-backup-without-fields-restores', () => {
    const app = createApp();
    const oldBackup = {
      schemaVersion: 2,
      unit: 'KG',
      defaultRest: 90,
      exercises: app.api.state.exercises.slice(0, 5),
      routines: [{ id: 'rt_old', name: 'Old Push', exercises: [{ exId: 'ex1', sets: 3 }] }],
      history: [{
        id: 'h_old',
        title: 'Old Session',
        date: Date.now() - 100000,
        totalVolume: 1000,
        totalSets: 1,
        exercises: [{ exId: 'ex1', sets: [{ type: 'N', weight: 80, reps: 10, done: true }] }]
      }]
    };

    const valid = app.api.validateBackupData(oldBackup);
    assert.equal(valid.ok, true, 'old backup validates');
    app.api.pendingRestore = valid.data;
    app.api.confirmRestore();

    assert.equal(app.api.state.dropStepPct, 20, 'dropStepPct defaults safely to 20');
    assert.equal(app.api.state.supersetAdvance, true, 'supersetAdvance defaults safely to true');
    assert.equal(app.api.state.routines[0].exercises[0].supersetId, null);
    assert.equal(app.api.state.routines[0].exercises[0].dropsAfterLast, 0);
  });

  it('handlers-compile', () => {
    const app = startEmpty(createApp());
    addExercise(app, 'ex1');
    addExercise(app, 'ex3');
    app.api.supersetWith(0, 1, 'workout');
    app.api.updateSetVal(0, 0, 'weight', '100');
    app.api.updateSetVal(0, 0, 'reps', '10');
    app.api.toggleSetDone(0, 0);
    app.api.renderActiveWorkout();

    app.api.openRoutineBuilder();
    app.api.editRoutine('rt1');

    const html = [
      app.el('activeExercisesContainer').innerHTML,
      app.el('routineBuilderExList').innerHTML,
      app.el('dropStepModal').innerHTML,
      app.el('supersetPickerModal').innerHTML,
    ].join('');

    const attrs = [...html.matchAll(/on(?:click|change|input)="([^"]*)"/g)].map(m => m[1]);
    assert.ok(attrs.length > 5, 'generated handlers found: ' + attrs.length);
    attrs.forEach(a => {
      new Function(a); // throws if syntax error
    });
  });

  it('no-rebuild-while-typing-in-drop-row', () => {
    const app = startEmpty(createApp());
    addExercise(app, 'ex1');
    app.api.updateSetVal(0, 0, 'weight', '100');
    app.api.updateSetVal(0, 0, 'reps', '10');
    app.api.toggleSetDone(0, 0);
    app.api.addDropSet(0, 0); // Drop row at index 1

    const box = sentinelBox(app);
    // Typing into drop row weight and reps
    app.api.updateSetVal(0, 1, 'weight', '75');
    assert.equal(box.innerHTML, 'SENTINEL', 'container NOT rebuilt while typing drop weight');
    assert.equal(app.api.activeWorkout.exercises[0].sets[1].weight, 75);

    app.api.updateSetVal(0, 1, 'reps', '12');
    assert.equal(box.innerHTML, 'SENTINEL', 'container NOT rebuilt while typing drop reps');
    assert.equal(app.api.activeWorkout.exercises[0].sets[1].reps, 12);
  });
});
